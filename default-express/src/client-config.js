const nconf = require('nconf');

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

module.exports = function(req, res) {
  res.set('Content-Type', 'application/javascript').send(cachedClientConfig);
};
