const cons = require('consolidate');
const path = require('path');
const winston = require('winston');

module.exports = function(app) {
  winston.debug('Configuring express for dust using consolidate');
  // require in our custom helpers, will expose them to dust for us
  app.engine('dust', cons.dust);
  app.set('view engine', 'dust');
  app.set('views', 'views');

  // pre-initialize the dust renderer. necessary because it's possible we send an email before someone loads a page
  cons.dust.render('notatemplate', {
    ext: app.get('view engine'),
    views: path.resolve(process.cwd(), app.get('views'))
  }, function() { /* we don't care about the return, it's an error anyway. but Dust is ready now */ });
  require('@bouncingpixel/dust-helpers')(cons.requires.dust);
};
