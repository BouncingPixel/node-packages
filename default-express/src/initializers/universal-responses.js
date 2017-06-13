const winston = require('winston');

module.exports = function(app) {
  winston.debug('Configuring util functions');
  app.use(require('@bouncingpixel/universal-response'));
};
