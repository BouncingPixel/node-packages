const defaultInitializers = [
  'database-adapters',
  'view-engine',
  'compression',
  'webpack-dev',
  'client-config',
  'public-dir',
  'universal-responses',
  'cookie-parser',
  'session',
  'flash',
  'auth-adapter',
  'express-logger',
  'body-parser',
  'force-redirects',
  'security',
  'set-locals',
  'routes',
  'view-router',
  '404',
  'error-router',
  'server-listen'
];

require('./extend-nodepath')();
require('./load-config')();

module.exports = {
  init: function init(initializers) {
    const initList = initializers || defaultInitializers;

    const express = require('express');
    const app = express();
    require('express-async-patch')(app);

    require('express-zones')(app);

    app.set('x-powered-by', false);
    app.enable('trust proxy');

    let current = Promise.resolve();

    initList.forEach(function(initializer) {
      if (typeof initializer === 'string') {
        initializer = require('./initializers/' + initializer);
      }

      current = current.then(function() {
        if (Array.isArray(initializer)) {
          return Promise.all(initializer);
        } else {
          return initializer(app);
        }
      });
    });

    return current.then(function() {
      return app;
    });
  }
};

// prevent someone from overriding the internal defaultInitializers
Object.defineProperty(module.exports, 'defaultInitializers', {
  get: function() {
    return defaultInitializers.slice();
  }
});
