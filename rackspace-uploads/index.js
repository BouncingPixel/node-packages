module.exports = require('./src/rackspace-service');

module.exports.middleware = {
  uploadDirectVarFactory: require('./src/upload-direct-var-factory'),
  uploadFile: require('./src/upload-file'),
  uploadResizedImage: require('./src/upload-resized-image')
};
