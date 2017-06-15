const bluebird = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = bluebird;

const nconf = require('nconf');

module.exports = {
  init: function() {
    const mongoConnectString = nconf.get('mongoConnectStr');

    const settings = {autoindex: process.env.NODE_ENV !== 'production'};
    return mongoose.connect(mongoConnectString, settings);
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
