const HttpErrors = require('@bouncingpixel/http-errors');

module.exports = function(app) {
  // set up our general 404 error handler
  app.use(function(req, res, next) {
    // if headers were sent, we assume something must have handled it and just ended with a next() call anyway
    if (!res.headersSent) {
      // pass it down to the general error handler
      next(new HttpErrors.NotFoundError('404 error occurred while attempting to load ' + req.url));
    }
  });
};
