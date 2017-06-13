const nconf = require('nconf');

module.exports = function() {
  let databaseAdapter = null;
  try {
    databaseAdapter = require(nconf.get('bpixDatabaseAdapter'));
  } catch (_e) {
    databaseAdapter = null;
  }

  if (databaseAdapter) {
    return databaseAdapter.init();
  }
};
