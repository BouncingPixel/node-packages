'use strict';

module.exports = function sendOkRedirect(page, data) {
  var req = this.req;
  var res = this.res;

  if (req.wantsJSON) {
    return res.status(200).jsonp(data);
  }

  if (page) {
    return res.redirect(page);
  }  else {
    return res.jsonp(data);
  }
};
