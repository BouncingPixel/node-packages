const nconf = require('nconf');
const path = require('path');

module.exports = function(app) {
  const routesFolder = nconf.get('routesPath') || path.resolve(process.cwd(), 'server/routes/');
  app.use(require('@bouncingpixel/express-handler-routing')(routesFolder));
};
