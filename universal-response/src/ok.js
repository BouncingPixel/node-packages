'use strict';

module.exports = function sendOK(view, data) {
  var req = this.req;
  var res = this.res;

  res.status(200);

  if (req.wantsJSON) {
    res.jsonp(data);
    return;
  }

  if (view) {
    res.render(view, data);
  } else {
    res.jsonp(data);
  }
};
