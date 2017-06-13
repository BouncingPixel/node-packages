const defaultInitializers = [
  'extend-nodepath',
  'load-config',
  'database-adapter',
  'view-engine',
  'trust-proxy',
  'powered-by',
  'compression',
  'webpack-dev',
  'webtools-verifier',
  'client-config',
  'public-dir',
  'force-redirects',
  'universal-responses',
  'cookie-parser',
  'session',
  'flash',
  'auth-adapter',
  'set-locals',
  'express-logger',
  'body-parser',
  'security',
  'routes',
  'view-router',
  '404',
  'error-router',
  'server-listen'
];

module.exports = {
  init: function init(initializers) {
    const initList = initializers || defaultInitializers;

    const express = require('express');
    const app = express();
    require('@bouncingpixel/express-async-patch')(app);

    let current = Promise.resolve();

    initList.forEach(function(initializer) {
      if (typeof initializer === 'string') {
        initializer = require('./initializers/' + initializer);
      }

      current = current.then(function() {
        return initializer(app);
      });
    });

    return current;
  },

  addInitializerBefore: function(list, beforeOther, initializer) {
    if (list == null) {
      list = defaultInitializers;
    }
    const indexOfOther = list.lastIndexOf(beforeOther);

    if (indexOfOther === -1) {
      return (Array.isArray(initializer) ? initializer : [initializer]).concat(list);
    } else {
      return list.slice(0, indexOfOther).concat(initializer).concat(list.slice(indexOfOther));
    }
  },

  addInitializerAfter: function(list, afterOther, initializer) {
    if (list == null) {
      list = defaultInitializers;
    }
    const indexOfOther = list.lastIndexOf(afterOther) + 1;

    if (indexOfOther === 0 || indexOfOther === list.length) {
      return list.concat(initializer);
    } else {
      return list.slice(0, indexOfOther).concat(initializer).concat(list.slice(indexOfOther));
    }
  },

  replaceInitializer: function(list, oldInitializer, newInitializer) {
    if (list == null) {
      list = defaultInitializers;
    }
    const indexOfOther = list.lastIndexOf(oldInitializer);

    if (indexOfOther === -1) {
      return list;
    } else {
      return list.splice(0, indexOfOther).concat(newInitializer).concat(list.slice(indexOfOther + 1));
    }
  }
};

// prevent someone from overriding the internal defaultInitializers
Object.defineProperty(module.exports, 'defaultInitializers', {
  get: function() {
    return defaultInitializers.slice();
  }
});
