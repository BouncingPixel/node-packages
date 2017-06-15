const nconf = require('nconf');

module.exports = function(app) {
  let authAdapter = null;
  try {
    authAdapter = nconf.get('provider:authAdapter');
  } catch (_e) {
    authAdapter = null;
  }

  if (authAdapter) {
    authAdapter.init(app);
  }
};
