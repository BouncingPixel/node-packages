const nconf = require('nconf');

module.exports = function(app) {
  app.use(function(req, res, next) {
    // expose some variables to dust automatically, so we don't have to in the routes
    if (req.user) {
      res.locals.loggedInUser = req.user;
    }

    res.locals.requireHTTPS = nconf.get('requireHTTPS');
    res.locals.sitedomain = nconf.get('siterootHost');
    res.locals.gatrackerid = nconf.get('gatrackerid');
    res.locals.facebookpixelcode = nconf.get('facebookpixelcode');

    let pagecanonProto = '';
    if (res.locals.requireHTTPS && res.locals.requireHTTPS.toString() === 'true') {
      pagecanonProto = 'https';
    } else {
      pagecanonProto = 'http';
    }

    res.locals.canonHost = `${pagecanonProto}://${res.locals.sitedomain}`;
    res.locals.pagecanonURL = `${res.locals.canonHost}${req.path}`;

    res.locals.ENV = nconf.get('client');

    if (process.env.NODE_ENV === 'production') {
      res.locals.NODE_ENV_PRODUCTION = true;
    }

    // the flash vars too for display
    if (req.method !== 'POST' && req.flash) {
      res.locals.flashError = req.flash('error');
      res.locals.flashWarn = req.flash('warn');
      res.locals.flashSuccess = req.flash('success');
      res.locals.flashInfo = req.flash('info');
    }

    next();
  });
};
