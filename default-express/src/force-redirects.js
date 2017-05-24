const nconf = require('nconf');

const requireHttps = nconf.get('requireHTTPS') && nconf.get('requireHTTPS').toString() === 'true';
const httpsRedirect = nconf.get('httpsRedirect') && nconf.get('httpsRedirect').toString() === 'true';
const requireDomain = nconf.get('forceDomain') && nconf.get('forceDomain').toString() === 'true';
const sitedomain = nconf.get('siterootHost');

module.exports = function(req, res, next) {
  const host = requireDomain ? sitedomain : req.get('Host');

  if (requireHttps && httpsRedirect) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, ['https://', host, req.url].join(''));
    }

    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (requireDomain && req.get('Host') !== sitedomain) {
    const proto = requireHttps ? 'https://' : (req.protocol + '://');
    return res.redirect(301, [proto, host, req.url].join(''));
  }

  next();
};
