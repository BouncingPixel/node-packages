const nconf = require('nconf');

module.exports = function(app) {
  let authAdapter = null;
  try {
    authAdapter = require(nconf.get('bpixAuthAdapter'));
  } catch (_e) {
    authAdapter = null;
  }

  if (authAdapter) {
    authAdapter.init(app);
  }
};
