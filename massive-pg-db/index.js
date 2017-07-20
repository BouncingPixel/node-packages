const bluebird = require('bluebird');
const nconf = require('nconf');

let instance = null;

module.exports = {
  init: function() {
    const connectString = nconf.get('massivejs:connectString');
    const scriptsPath = nconf.get('massivejs:scriptsPath');

    const massive = require('massive');
    return massive(
      connectString,
      {
        promiseLib: bluebird,
        scripts: scriptsPath
      }
    ).then(function(massiveInstance) {
      instance = massiveInstance;
      return instance;
    });
  },

  getSessionStore: function(session, options) {
    const PgStore = require('connect-pg-simple')(session);

    const sessionTableName = nconf.get('massivejs:sessiontable') || 'session';

    const storeOptions = Object.assign({}, {
      pgPromise: instance.instance,
      tableName: sessionTableName
    }, options || {});

    return new PgStore(storeOptions);
  },

  get instance() {
    return instance;
  }
};
