const nconf = require('nconf');
const winston = require('winston');

const cachedClientConfig = `(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('config', [], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    window.SiteConfig = factory();
  }
}(this, function() {
  return {
    ENV: ${JSON.stringify(nconf.get('client'))}
  };
}));`;

module.exports = function(app) {
  winston.debug('Creating client side config in /js/config.js');
  app.get('/js/config.js', function(req, res) {
    res.set('Content-Type', 'application/javascript').send(cachedClientConfig);
  });
};
