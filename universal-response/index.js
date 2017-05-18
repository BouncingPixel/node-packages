'use strict';

var responses = {
  ok: require('./src/ok'),
  okRedirect: require('./src/ok-redirect')
};

module.exports = function addResponseMiddleware(req, res, next) {
  if (req.wantsJSON == null) {
    req.wantsJSON = req.xhr || (req.accepts('html', 'json') === 'json');
  }

  for (var prop in responses) {
    res[prop] = responses[prop].bind({req: req, res: res, next: next});
  }

  next();
};
