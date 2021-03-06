const LoginLocker = require('./models/login-locker');
const RememberToken = require('./models/remember-token');

let User = null;
let ssoExtendProfileFn = null;

const passportAuthImpl = {
  serializeUser: function(user) {
    return JSON.stringify({id: user._id.toString()});
  },

  deserializeUser: function(info, _req) {
    const obj = JSON.parse(info);
    return User.findOne({_id: obj.id});
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
    if (!lockout) {
      return Promise.resolve();
    }

    lockout.failedCount = 0;
    return lockout.save();
  },

  failedLogin: function(user, email, _lockout) {
    const updates = {
      $inc: {failedCount: 1},
      $currentDate: {lastAttempt: true}
    };

    return LoginLocker.update({email: email}, updates, {upsert: true}).exec();
  },

  successTokenLogin: function(user, _lockout) {
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

    if (ssoExtendProfileFn) {
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
    return user.isRoleAtLeast(desiredRole);
  }
};

Object.defineProperty(passportAuthImpl, 'UserModel', {
  get: function() {
    return User;
  },
  set: function(model) {
    User = model;
  }
});

Object.defineProperty(passportAuthImpl, 'ssoExtendProfileFn', {
  get: function() {
    return ssoExtendProfileFn;
  },
  set: function(fn) {
    ssoExtendProfileFn = fn;
  }
});

module.exports = passportAuthImpl;
