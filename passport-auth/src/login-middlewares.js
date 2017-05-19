function generalLogin(req, user, done) {
  if (!user) {
    return done(new NotAuthorizedError('Invalid username or password'));
  }

  if (user.isLocked) {
    return done(new AccountLockedError('User account is locked'));
  }

  const saveRedirectTo = req.session.redirectto;

  req.session.regenerate(function() {
    req.logIn(user, function(err) {
      if (err) {
        return done(err);
      }

      // if there's anything specific about the session that needs to be stored
      req.session.startAt = new Date().getTime();
      if (saveRedirectTo) {
        req.session.redirectto = saveRedirectTo;
      }
      done();
    });
  });
}

module.exports = function(impl) {
  return {
    // only issues remember-me token if the POST body variable rememberme is "true" (string or boolean)
    issueRememberMe: function(req, res, next) {
      if (!req.user) {
        return next();
      }

      if (req.method.toLowerCase() !== 'post' || !(req.body.rememberme === true || req.body.rememberme === 'true')) {
        return next();
      }

      impl
        .generateRememberMe(req.user.id)
        .then(function(token) {
          let cookieInfo = {path: '/', httpOnly: true, maxAge: 2 * 7 * 24 * 3600 * 1000};
          if (nconf.get('requireHTTPS') === true || nconf.get('requireHTTPS') === 'true') {
            cookieInfo.secure = true;
          }

          res.cookie('remember_me', token, cookieInfo);
          next();
        })
        .catch(function(err) {
          next(err);
        });
    },

    login: function(req, res, next) {
      passport.authenticate('local', function(err, user) {
        if (err) {
          return next(err);
        }

        // passport's default behavior is not to prevent session fixation, so we do it ourselves
        generalLogin(req, user, next);
        // next();
      })(req, res, next);
    },

    tokenLogin: function(req, res, next) {
      passport.authenticate('token', function(err, user) {
        if (err) {
          return next(err);
        }

        generalLogin(req, user, next);
      })(req, res, next);
    },

    oathLoginStartFactory: function(provider, scope) {
      return passport.authenticate(provider, scope);
    },

    oathLoginCallbackFactory: function(provider) {
      return function(req, res, next) {
        passport.authenticate(provider, function(err, user) {
          if (err) {
            return next(err);
          }

          generalLogin(req, user, next);
        })(req, res, next);
      };
    },

    logout: function(req, res, next) {
      res.clearCookie('remember_me');
      req.logout();
      req.session.destroy(function() {
        next();
      });
    }
  };
};
