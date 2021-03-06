const bluebird = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = bluebird;

const nconf = require('nconf');

module.exports = {
  init: function() {
    const mongoConnectString = nconf.get('mongoConnectStr');
    const mongooseSettings = nconf.get('mongooseSettings') || {};
    // Mongoose >5 uses mongo client by default
    // setting was triggering a warning
    // if (!mongooseSettings.hasOwnProperty('useMongoClient')) {
    //   mongooseSettings.useMongoClient = true;
    // }

    return mongoose.connect(mongoConnectString, mongooseSettings);
  },

  getSessionStore: function(session) {
    const MongoStore = require('connect-mongo')(session);

    return new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 14 * 24 * 3600,
      touchAfter: 3600
    });
  }
};
