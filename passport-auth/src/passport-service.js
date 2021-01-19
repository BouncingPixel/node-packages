'use strict';

const bcrypt = require('bcryptjs');
const bluebird = require('bluebird');
const nconf = require('nconf');
const BadRequestError = require('@bouncingpixel/http-errors').BadRequestError;
const LocalStrategy = require('passport-local').Strategy;

const authImpl = nconf.get('provider:passportAuthImpl');

const PassportService = {

  serializeUser: function(user, done) {
    Promise
      .resolve(authImpl.serializeUser(user))
      .then(function(info) {
        done(null, info);
      })
      .catch(function(err) {
        done(err);
      });
  },

  deserializeUser: function(req, info, done) {
    Promise
      .resolve(authImpl.deserializeUser(info, req))
      .then(function(user) {
        done(null, user);
      })
      .catch(function(err) {
        done(err);
      });
  },

  localStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    bluebird.coroutine(function*() {
      const lowerEmail = email.toLowerCase();

      let [user, lockInfo] = yield Promise.all([
        authImpl.findUserForLogin(lowerEmail),
        authImpl.findLockoutInfo(lowerEmail)
      ]);

      const maxFailTries = parseInt(nconf.get('maxFailTries'), 10);
      if (lockInfo && lockInfo.lastAttempt && lockInfo.failedCount >= maxFailTries) {
        const maxLockTime = parseInt(nconf.get('maxLockTime'), 10);

        // sure, we recompute this every time, but our DB queries are atomic this way
        const lockedForMs = Math.min(
          maxLockTime,
          Math.pow(lockInfo.failedCount - maxFailTries, 2) * 5
        );

        if ((lockInfo.lastAttempt.getTime() + lockedForMs) >= new Date().getTime()) {
          // do absolutely nothing if locked
          return false;
        }
      }

      // TODO: add audit log

      const checkPassword = user ? user.password : 'THISISNOTVALIDBCRYPTANYWAY';
      let isValid = yield bcrypt.compare(password, checkPassword);
      if (!user) {
        isValid = false;
      }

      if (isValid) {
        yield authImpl.successLogin(user, lockInfo);
        return user;
      } else {
        yield authImpl.failedLogin(user, lowerEmail, lockInfo);
        return false;
      }
    })().then(function(toReturn) {
      done(null, toReturn);
      return null;
    }).catch(function(err) {
      done(err);
    });
  }),

  passwordlessStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'token',
    passReqToCallback: true
  },
  function(req, email, token, done) {
    bluebird.coroutine(function*() {
      const lowerEmail = email.toLowerCase();

      let [user, lockInfo] = yield Promise.all([
        authImpl.findUserForToken(lowerEmail),
        authImpl.findLockoutInfo(lowerEmail)
      ]);

      if (lockInfo && lockInfo.lockedUntil && new Date() <= lockInfo.lockedUntil) {
        // do absolutely nothing if locked
        return false;
      }

      const checkToken = user ? user.logintoken : 'THISISNOTVALIDBCRYPTANYWAY';
      let isValid = yield bcrypt.compare(token, checkToken);
      if (!user) {
        isValid = false;
      }

      // we don't mess with the lock out with tokens, but we could
      if (!isValid) {
        return false;
      }

      yield authImpl.successTokenLogin(user, lockInfo);

      return user;
    })().then(function(toReturn) {
      done(null, toReturn);
      return null;
    }).catch(done);
  })

};

if (nconf.get('auth:enablerememberme')) {
  const RememberMeStrategy = require('passport-remember-me').Strategy;

  PassportService.rememberMeStrategy = new RememberMeStrategy(function(token, done) {
    authImpl
      .consumeRememberMe(token)
      .then(function(userid) {
        if (!userid) {
          return Promise.resolve(null);
        }

        return authImpl.findUserById(userid);
      })
      .then(function(user) {
        if (!user) {
          done(null, false);
          return;
        }

        done(user);
        return;
      })
      .catch(function(err) {
        done(err);
      });
  },

  function(user, done) {
    authImpl
      .generateRememberMe(user._id || user.id)
      .then(function(token) {
        done(null, token);
      })
      .catch(function(err) {
        done(err);
      });
  });
}

const baseUrl = (nconf.get('requireHTTPS') ? 'https://' : 'http://') + nconf.get('siterootHost');

// be user to uncomment the necessary areas in User model before enabling
if (nconf.get('sso:facebook:appid') && nconf.get('sso:facebook:secret')) {
  const FacebookStrategy = require('passport-facebook').Strategy;

  PassportService.facebookStrategy = new FacebookStrategy({
    clientID: nconf.get('sso:facebook:appid'),
    clientSecret: nconf.get('sso:facebook:secret'),
    callbackURL: baseUrl + '/auth/facebook/callback',
    enableProof: true,
    // add  'picture.type(large)' if you want the profile pic
    profileFields: ['id', 'first_name', 'last_name', 'email'],
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:google:clientid') && nconf.get('sso:google:secret')) {
  const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

  PassportService.googleStrategy = new GoogleStrategy({
    clientID: nconf.get('sso:google:clientid'),
    clientSecret: nconf.get('sso:google:secret'),
    callbackURL: baseUrl + '/auth/google/callback',
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:twitter:key') && nconf.get('sso:twitter:secret')) {
  const TwitterStrategy = require('passport-twitter').Strategy;

  PassportService.twitterStrategy = new TwitterStrategy({
    consumerKey: nconf.get('sso:twitter:key'),
    consumerSecret: nconf.get('sso:twitter:secret'),
    callbackURL: baseUrl + '/auth/twitter/callback',
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:linkedin:key') && nconf.get('sso:linkedin:secret')) {
  const LinkedInStrategy = require('passport-linkedin').Strategy;

  PassportService.linkedinStrategy = new LinkedInStrategy({
    consumerKey: nconf.get('sso:linkedin:key'),
    consumerSecret: nconf.get('sso:linkedin:secret'),
    callbackURL: baseUrl + '/auth/linkedin/callback',
    // add 'public-profile-url' if you want the profile pic
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline'],
    passReqToCallback: true
  }, authWithSso);
}

function* continueWithProfile(profile) {
  let user = yield authImpl.findUserBySSO(profile.provider, profile.id);

  if (user) {
    return user;
  }

  // the template requires an email for login, but in reality, the email itself could be ignored
  // in that case, the user is required to log in with their social media forever,
  // unless they associate an email with their account later
  if (profile.emails == null || !Array.isArray(profile.emails) || profile.emails.length === 0) {
    // if the system does not require emails, just skip the look up based on email and go straight to create a new account
    throw new BadRequestError('Could not determine email to create an account');
  }

  const emails = profile.emails.map((info) => {
    return info.value.toLowerCase();
  });

  user = yield authImpl.findUserWithEmailIn(emails);

  // create a new account if one did not exist previously
  if (!user) {
    user = yield Promise.resolve(authImpl.createUserForSSO(profile));
  }

  return yield authImpl.associateUserForSSO(user, profile);
}

function* authWithSsoAsync(req, accessToken, refreshToken, profile) {
  if (req.user) {
    return yield authImpl.associateUserForSSO(req.user, profile);
  }

  return yield* continueWithProfile(profile);
}

function authWithSso(req, accessToken, refreshToken, profile, done) {
  bluebird.coroutine(
    authWithSsoAsync(req, accessToken, refreshToken, profile)
  ).then((user) => {
    done(null, user);
  }).catch((err) => {
    done(err);
  });
}

module.exports = PassportService;
