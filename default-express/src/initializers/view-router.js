const nconf = require('nconf');
const path = require('path');

module.exports = function(app) {
  // add ability to display static pages inside the views/static/ directory
  const pagesFolder = nconf.get('viewPagesFolder') || 'pages';
  app.use(
    require('@bouncingpixel/express-view-routing')(
      path.resolve(process.cwd(), app.get('views')),
      pagesFolder,
      app.get('view engine')
    )
  );
};
