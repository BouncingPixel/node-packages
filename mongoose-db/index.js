const mongoose = require('mongoose');
const nconf = require('nconf');
const path = require('path');

module.exports = function(options) {
  modelsDirectory
  userModelName
  ssoExtendProfileFn

  return {
    init: function() {
      const mongoConnectString = nconf.get('mongoConnectStr');

      winston.debug('Connect to mongoose database');
      const promise =
        mongoose
          .connect(mongoConnectString, {autoindex: process.env.NODE_ENV !== 'production'})
          .then(function() {
            if (options.modelsDirectory) {
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
    }
  };
};

function isJsAndNotIndex(file) {
  return file.substring(file.length - 3) === '.js' && file !== 'index.js';
}
