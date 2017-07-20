const nconf = require('nconf');
const forwardedHttp = require('forwarded-http');

const requireHttps = nconf.get('requireHTTPS') && nconf.get('requireHTTPS').toString() === 'true';
const requireDomain = nconf.get('forceDomain') && nconf.get('forceDomain').toString() === 'true';

module.exports = function(app) {
  function forceHttpsMiddleware(addHsts) {
    return function(req, res, next) {
      const host = nconf.get('siterootHost') || req.get('Host');

      if (addHsts) {
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      const forwardedInfo = forwardedHttp(req);

      if (forwardedInfo.proto === 'https') {
        next();
        return;
      }

      // we can only redirect get requests anyway
      if (req.method.toLowerCase() !== 'get') {
        // OWASP recommendation was drop the request, so that's what we do
        // ideally, HSTS should prevent it, but this is the fallback
        // but still destroy the socket to not leave it hanging around
        req.socket.destroy();
        return;
      }

      // for GET requests, we redirect to the HTTPS version
      return res.redirect(['https://', host, req.url].join(''));
    };
  }

  function forceDomainMiddleware(req, res, next) {
    const sitedomain = nconf.get('siterootHost');

    if (req.get('Host') !== sitedomain) {
      const proto = requireHttps ? 'https://' : (req.protocol + '://');
      return res.redirect([proto, sitedomain, req.url].join(''));
    }

    next();
  }

  // only add force site-wide if enabled
  if (requireHttps) {
    app.use(forceHttpsMiddleware(true));
  }
  if (requireDomain) {
    app.use(forceDomainMiddleware);
  }

  // always add the zones. even if it's site wide, the zones won't hurt
  app.zone('https').use(forceHttpsMiddleware(false));
  app.zone('force-domain').use(forceDomainMiddleware);
};
