const bluebird = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = bluebird;

const nconf = require('nconf');
const path = require('path');

module.exports = {
  init: function(modelsDirectory) {
    const mongoConnectString = nconf.get('mongoConnectStr');

    const promise =
      mongoose
        .connect(mongoConnectString, {autoindex: process.env.NODE_ENV !== 'production'})
        .then(function() {
          if (modelsDirectory) {
            const potentialModels =
              fs
                .readdirSync(modelDirectory)
                .filter(isJsAndNotIndex)
                .map((model) => model.substring(0, model.length - 3));

            potentialModels.map((modelFile) => {
              return require(path.join(modelsDirectory, modelFile));
            });
          }
        });
  },

  getSessionStore: function(session) {
    const MongoStore = require('connect-mongo')(session);

    return new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 14 * 24 * 3600,
      touchAfter: 3600
    });
  },

  passportImplFactory: require('./src/passport-impl')
};

function isJsAndNotIndex(file) {
  return file.substring(file.length - 3) === '.js' && file !== 'index.js';
}
