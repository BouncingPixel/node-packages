const nconf = require('nconf');
const path = require('path');

module.exports = function(app) {
  const routesFolder = nconf.get('routesPath') || path.resolve(process.cwd(), 'server/routes/');
  app.set('routes-dir', routesFolder);
  require('@bouncingpixel/express-handler-routing')(app);
};
