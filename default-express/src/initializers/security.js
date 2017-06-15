const csrf = require('csurf');
const csrfMiddleware = csrf({cookie: true});

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-FRAME-OPTIONS', 'SAMEORIGIN');
    next();
  });

  app.zone('csrf').use(function(req, res, next) {
    // this was originally set to non-POST only, but had some issues
    // so instead, using a lazy fetch for the CSRF
    // DustJS will call the function if it needs the value, otherwise, the CSRF isn't generated
    let csrfToken = null;
    res.locals._csrf = function() {
      if (!csrfToken) {
        csrfToken = req.csrfToken();
      }
      return csrfToken;
    };

    csrfMiddleware(req, res, next);
  });
};
