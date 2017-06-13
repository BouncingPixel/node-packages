const nconf = require('nconf');

module.exports = function(app) {
  // the catch all and, general error handler. use next(err) to send it through this
  app.use(require('@bouncingpixel/error-router')({
    enableFlash: true,
    redirectOn401: nconf.get('redirectOn401') || '/login',
    sessionRedirectVar: 'redirectto'
  }));
};
