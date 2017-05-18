const passport = require('passport');

module.exports = function(impl) {
  const PassportService = require('./src/passport-service')(impl);
  const loginMiddlewares = require('./src/login-middlewares')(impl);

  return {
    init: function(app) {
      app.use(passport.initialize());
      app.use(passport.session());

      passport.serializeUser(PassportService.serializeUser);
      passport.deserializeUser(PassportService.deserializeUser);

      passport.use(PassportService.localStrategy);

      if (PassportService.passwordlessStrategy) {
        passport.use('token', PassportService.passwordlessStrategy);
      }
      if (PassportService.rememberMeStrategy) {
        passport.use('remember-me', PassportService.rememberMeStrategy);
      }
      if (PassportService.facebookStrategy) {
        passport.use(PassportService.facebookStrategy);
      }
      if (PassportService.googleStrategy) {
        passport.use(PassportService.googleStrategy);
      }
      if (PassportService.twitterStrategy) {
        passport.use(PassportService.twitterStrategy);
      }
      if (PassportService.linkedinStrategy) {
        passport.use(PassportService.linkedinStrategy);
      }

      if (PassportService.rememberMeStrategy) {
        app.use(passport.authenticate('remember-me'));
      }
    },

    middlewares: {
      issueRememberMe: loginMiddlewares.issueRememberMe,
      login: loginMiddlewares.login,
      tokenLogin: loginMiddlewares.tokenLogin,
      logout: loginMiddlewares.logout,

      requireLoggedIn: require('./src/require-logged-in'),
      requireLoggedOut: require('./src/require-logged-out'),
      requireUserRole: require('./src/require-user-role')(impl)
    }
  };
};
