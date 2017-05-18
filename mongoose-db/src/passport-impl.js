const mongoose = require('mongoose');

const LoginLocker = require('../models/login-locker');
const RememberToken = require('../models/remember-me');

module.exports = function(User, ssoExtendProfileFn) {
  return {
    serializeUser: function(user) {
      return JSON.stringify({id: user._id.toString()});
    },

    deserializeUser: function(info, req) {
      const obj = JSON.parse(info);
      return User.findOne({_id: obj._id});
    },

    findUserById: function(id) {
      return User.findOne({_id: id});
    },

    findUserWithEmailIn: function(emails) {
      return User.findOne({email: emails});
    },

    findUserBySSO: function(provider, id) {
      let matchByProvider = {};
      matchByProvider[provider + 'Id'] = id;

      return User.findOne(matchByProvider);
    },

    findUserForLogin: function(lowerEmail) {
      return User.findOne({
        email: lowerEmail,
        role: {$ne: 'noaccess'},
        deactivatedat: null
      });
    },

    findUserForToken: function(lowerEmail) {
      return User.findOne({
        email: lowerEmail,
        role: {$ne: 'noaccess'},
        deactivatedat: null,
        tokenexpire: {$gte: new Date()}
      });
    },

    findLockoutInfo: function(lowerEmail) {
      return LoginLocker.findOne({email: lowerEmail});
    },

    successLogin: function(user, lockout) {
      lockout.failedCount = 0;
      yield lockout.save();
    },

    failedLogin: function(user, lockout, lockedUntilTime) {
      if (!lockout) {
        lockout = new LoginLocker();
      }

      if (lockedUntilTime != null) {
        lockout.lockedUntil = new Date(lockedUntilTime);
      }

      lockout.failedCount += 1;
      return lockout.save();
    },

    successTokenLogin: function(user, lockout) {
      user.logintoken = null;
      user.tokenexpire = null;
      return user.save();
    },

    consumeRememberMe: function(token) {
      return new Promise(function(resolve, reject) {
        RememberToken.consume(token, function(err, userId) {
          if (err) {
            reject(err);
          } else {
            resolve(userId);
          }
        });
      });
    },

    generateRememberMe: function(userid) {
      return new Promise(function(resolve, reject) {
        RememberToken.generate(userid, function(err, token) {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        });
      });
    },

    associateUserForSSO: function(user, profile) {
      user[profile.provider + 'Id'] = profile.id;

      if (ssoAssociate) {
        ssoExtendProfileFn(user, profile);
      }

      // if you wanted to store the user's social URLs:
      // if (profile.provider === 'facebook') {
      //   if (!user.socialFacebookUrl || !user.socialFacebookUrl.length) {
      //     user.socialFacebookUrl = 'https://www.facebook.com/' + profile.id;
      //   }
      // } else if (profile.provider === 'linkedin') {
      //   // LinkedIn can provide us with title if we wanted it
      //   if ((!user.title || !user.title.length) && profile._json.headline) {
      //     user.title = profile._json.headline;
      //   }

      //   if (!user.socialLinkedinUrl || !user.socialLinkedinUrl.length) {
      //     user.socialLinkedinUrl = profile._json.publicProfileUrl;
      //   }
      // } else if (profile.provider === 'twitter') {
      //   if (!user.socialTwitterUrl || !user.socialTwitterUrl.length) {
      //     user.socialTwitterUrl = 'https://twitter.com/intent/user?user_id=' + profile.id;
      //   }
      // }

      return user.save();
    },

    createUserForSSO: function(profile) {
      const userObj = {
        name: [profile.name.givenName, profile.name.familyName].join(' '),
        email: profile.emails[0].value
      };

      return new User(userObj);
    },

    isUserRoleAtleast: function(user, desiredRole) {
      return req.user.isRoleAtLeast(roleName);
    }

  };
};
