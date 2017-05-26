const express = require('express');
const methods = require('methods');

const wrapMiddleware = require('./wrap-middleware');

module.exports = function expressAsyncPatch(app) {
  patch(app);
  patch(express.Router);
};

module.exports.wrapMiddleware = wrapMiddleware;

function patch(thing) {
  const fnsToPatch = ['use'].concat(methods);

  const oldFns = fnsToPatch.reduce(function(fns, fnName) {
    fns[fnName] = thing[fnName];
    return fns;
  }, {});

  const patches = {
    use: function(...middlewares) {
      const args = middlewares.map(wrapMiddleware);
      return oldFns.use.apply(this, args);
    },

    METHOD: function(method) {
      return function(p1, ...middlewares) {
        const args = [p1].concat(middlewares.map(wrapMiddleware));
        return oldFns[method].apply(this, args);
      };
    }
  };

  fnsToPatch.forEach((fnName) => {
    if (patches[fnName]) {
      thing[fnName] = patches[fnName];
    } else {
      thing[fnName] = patches.METHOD(fnName);
    }
  });
}
