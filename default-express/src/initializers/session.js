const nconf = require('nconf');
const session = require('express-session');
const winston = require('winston');

module.exports = function(app) {
  let databaseAdapter = null;
  try {
    databaseAdapter = require(nconf.get('bpixDatabaseAdapter'));
  } catch (_e) {
    databaseAdapter = null;
  }

  winston.debug('Setting up session store');
  const sessionStore = databaseAdapter ?
    databaseAdapter.getSessionStore(session) : (new session.MemoryStore());

  app.use(session({
    store: sessionStore,
    secret: nconf.get('sessionSecret'),
    resave: true,
    saveUninitialized: true
  }));
};
