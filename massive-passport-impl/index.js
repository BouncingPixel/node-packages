const crypto = require('crypto');
const massive = require('@bouncingpixel/massive-pg-db');
const nconf = require('nconf');

let ssoExtendProfileFn = null;

function generateRandomToken() {
  return new Promise(function(resolve, reject) {
    crypto.randomBytes(48, function(ex, buf) {
      if (ex) {
        reject(ex);
        return;
      }

      const token = buf.toString('hex');
      resolve(token);
    });
  });
}

const passportAuthImpl = {
  serializeUser: function(user) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');
    const pk = db[usertable].pk;

    return JSON.stringify({id: user[pk].toString()});
  },

  deserializeUser: function(info, _req) {
    const obj = JSON.parse(info);

    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');
    const pk = db[usertable].pk;

    const search = {};
    search[pk] = obj.id;

    return db[usertable].findOne(search);
  },

  findUserById: function(id) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');
    const pk = db[usertable].pk;

    const search = {};
    search[pk] = id;

    return db[usertable].findOne(search);
  },

  findUserWithEmailIn: function(emails) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');

    return db[usertable].findOne({email: emails});
  },

  findUserBySSO: function(provider, id) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');

    let matchByProvider = {};
    matchByProvider[provider + 'Id'] = id;

    return db[usertable].findOne(matchByProvider);
  },

  findUserForLogin: function(lowerEmail) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');

    return db[usertable].findOne({
      email: lowerEmail,
      'role <>': 'noaccess',
      deactivatedat: null
    });
  },

  findUserForToken: function(lowerEmail) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');

    return db[usertable].findOne({
      email: lowerEmail,
      'role <>': 'noaccess',
      deactivatedat: null,
      'tokenexpire >=': new Date()
    });
  },

  findLockoutInfo: function(lowerEmail) {
    const db = massive.instance;
    const lockouttable = nconf.get('massivepassport:lockouttable');

    return db[lockouttable].findOne({email: lowerEmail});
  },

  successLogin: function(user, lockout) {
    if (!lockout) {
      return Promise.resolve();
    }

    const db = massive.instance;
    const lockouttable = nconf.get('massivepassport:lockouttable');

    lockout.failedCount = 0;
    return db[lockouttable].save(lockout);
  },

  failedLogin: function(user, email, _lockout) {
    const db = massive.instance;
    const lockouttable = nconf.get('massivepassport:lockouttable');

    if (!db[lockouttable]) {
      return Promise.reject('lockouttable is not set to a valid table name');
    }

    // have to do an upsert, but also the +1 atomically
    // only way is with raw SQL right now
    return db.run(
      'INSERT INTO ' +
        lockouttable +
        ' (email,failedcount,currentdate) VALUES ($1, 1, now()) ON CONFLICT (email)' +
        ' DO UPDATE SET failedcount=failedcount+1 currentdate=now();',
      [email]
    );
  },

  successTokenLogin: function(user, _lockout) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');
    const pk = db[usertable].pk;

    const updates = {
      logintoken: null,
      tokenexpire: null
    };
    updates[pk] = user[pk];

    return db[usertable].save(updates);
  },

  consumeRememberMe: function(token) {
    const db = massive.instance;
    const remembermetable = nconf.get('massivepassport:remembermetable');

    return db[remembermetable].findOne({token: token}).then(function(rememberme) {
      if (!rememberme) {
        return null;
      }

      const userid = rememberme.userid;

      return db[remembermetable].destroy({token: token}).then(function() {
        return userid;
      });
    });
  },

  generateRememberMe: function(userid) {
    const db = massive.instance;
    const remembermetable = nconf.get('massivepassport:remembermetable');

    return generateRandomToken().then(function(token) {
      return db[remembermetable].save({
        token: token,
        userid: userid
      });
    });
  },

  associateUserForSSO: function(user, profile) {
    const db = massive.instance;
    const usertable = nconf.get('massivepassport:usertable');

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

    return db[usertable].save(user);
  },

  createUserForSSO: function(profile) {
    const userObj = {
      name: [profile.name.givenName, profile.name.familyName].join(' '),
      email: profile.emails[0].value
    };

    return userObj;
  },

  isUserRoleAtleast: function(user, desiredRole) {
    return user.isRoleAtLeast(desiredRole);
  }
};

Object.defineProperty(passportAuthImpl, 'ssoExtendProfileFn', {
  get: function() {
    return ssoExtendProfileFn;
  },
  set: function(fn) {
    ssoExtendProfileFn = fn;
  }
});

module.exports = passportAuthImpl;
