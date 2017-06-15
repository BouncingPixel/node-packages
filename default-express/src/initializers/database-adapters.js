const nconf = require('nconf');

module.exports = function(app) {
  let databaseAdapter = null;
  try {
    databaseAdapter = nconf.get('provider:databaseAdapter');
  } catch (_e) {
    databaseAdapter = null;
  }

  if (databaseAdapter) {
    if (Array.isArray(databaseAdapter)) {
      return Promise.all(databaseAdapter.map((da) => da.init(app)));
    } else {
      return databaseAdapter.init(app);
    }
  }
};
