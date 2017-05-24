const nconf = require('nconf');
const path = require('path');
const winston = require('winston');
const HttpErrors = require('@bouncingpixel/http-errors');

module.exports = function(app) {
  // add ability to display static pages inside the views/pages/ directory
  app.use(require('@bouncingpixel/auto-static-routes')(path.resolve(__dirname, '../views/'), 'static'));

  // set up our general 404 error handler
  app.use(function(req, res, next) {
    // if headers were sent, we assume something must have handled it and just ended with a next() call anyway
    if (!res.headersSent) {
      // pass it down to the general error handler
      next(new HttpErrors.NotFoundError('404 error occurred while attempting to load ' + req.url));
    }
  });

  // the catch all and, general error handler. use next(err) to send it through this
  app.use(require('@bouncingpixel/error-router')({
    enableFlash: true,
    redirectOn401: '/',
    sessionRedirectVar: 'redirectto'
  }));

  const port = nconf.get('PORT');

  app.listen(port, function() {
    winston.info(`App listening on port ${port}`);
  });
};
