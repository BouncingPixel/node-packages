const csrf = require('csurf');

const csrfMiddleware = csrf({cookie: true});

module.exports = function(req, res, next) {
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-FRAME-OPTIONS', 'SAMEORIGIN');

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

  // wrap it, because multer complicates things. but, we will add csrf back in later
  if (req.headers['content-type'] && req.headers['content-type'].substr(0, 19).toLowerCase() === 'multipart/form-data') {
    next();
    return;
  }

  csrfMiddleware(req, res, next);

};
