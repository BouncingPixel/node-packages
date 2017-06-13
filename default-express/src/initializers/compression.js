const compression = require('compression');

module.exports = function(app) {
  // compression should be before the statics and other routes
  app.use(compression());
};
