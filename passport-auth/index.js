const passport = require('passport');

const PassportService = require('./src/passport-service');
const loginMiddlewares = require('./src/login-middlewares');

const PassportAuth = {
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
    requireUserRole: require('./src/require-user-role')
  }
};

if (PassportService.facebookStrategy) {
  PassportAuth.middlewares.facebookStart = loginMiddlewares.oathLoginStartFactory(
    'facebook', {scope: ['email', 'public_profile']}
  );
  PassportAuth.middlewares.facebookCallback = loginMiddlewares.oathLoginCallbackFactory('facebook');
}
if (PassportService.googleStrategy) {
  PassportAuth.middlewares.googleStart = loginMiddlewares.oathLoginStartFactory(
    'google', {scope: ['email', 'profile']}
  );
  PassportAuth.middlewares.googleCallback = loginMiddlewares.oathLoginCallbackFactory('google');
}
if (PassportService.twitterStrategy) {
  PassportAuth.middlewares.twitterStart = loginMiddlewares.oathLoginStartFactory(
    'twitter', {scope: ['email']}
  );
  PassportAuth.middlewares.twitterCallback = loginMiddlewares.oathLoginCallbackFactory('twitter');
}
if (PassportService.linkedinStrategy) {
  PassportAuth.middlewares.linkedinStart = loginMiddlewares.oathLoginStartFactory(
    'linkedin', {scope: ['r_basicprofile', 'r_emailaddress']}
  );
  PassportAuth.middlewares.linkedinCallback = loginMiddlewares.oathLoginCallbackFactory('linkedin');
}

module.exports = PassportAuth;
