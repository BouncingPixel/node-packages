const fs = require('fs');
const path = require('path');

const express = require('express');
const logger = require('winston');
const methods = require('methods');

// this one is used in production
function createAllRoutes(baseViewsDir) {
  // create an express router
  const router = express.Router();

  // go through list of files and add routes for each of them
  const staticDir = path.join(baseViewsDir);
  addRoutesInDir(staticDir, '/', router);

  // we return the router, even though this is async and the router is filled later
  // express is fine with this
  return router;
}

// no callback as it doesn't really matter. we don't notify anything that we are done
function addRoutesInDir(baseDir, dir, router) {
  const fullDir = path.join(baseDir, dir);

  fs.stat(fullDir, function(err, stats) {
    if (err) {
      logger.warn(err);
      return;
    }

    if (stats.isDirectory()) {
      fs.readdir(fullDir, function(err, files) {
        if (err) {
          logger.warn(err);
          return;
        }

        files.forEach(function(file) {
          addRoutesInDir(baseDir, path.join(dir, file), router);
        });
      });
    } else {
      // make sure it ends in .js
      if (dir.lastIndexOf('.js') !== (dir.length - 3)) {
        return;
      }

      const isIndex = dir.lastIndexOf('/index.js') === (dir.length - 9);
      const url = isIndex ? dir.substr(0, dir.length - 9) : dir.substr(0, dir.length - 3);

      const parameterizedUrl = makeExpressPath(url);

      const routeMethods = require(fullDir);

      if (routeMethods) {
        if (Object.getPrototypeOf(routeMethods) === express.Router) {
          logger.debug(`Adding middleware via use to "${parameterizedUrl}"`);
          router.use(parameterizedUrl, routeMethods);
        } else {
          addRoutes(router, parameterizedUrl, routeMethods);
        }
      }
    }
  });
}

function addRoutes(router, baseUrl, routeMethods) {
  for (const item in routeMethods) {
    if (methods.indexOf(item) !== -1) {
      // if it is a method, then we mount it to the URL
      const method = item;
      const routeInfo = routeMethods[method];
      const pre = routeInfo.pre || [];

      // defaulting to empty array as a way to exclude from .concat
      const handler = routeInfo.handler || [];
      const post = routeInfo.post || [];

      const routerArgs = [baseUrl].concat(pre).concat(handler).concat(post);

      if (routerArgs.length === 1) {
        logger.warn(`A route, "${baseUrl}", may not be performing any action due to missing handler, pre, and/or post`);
      }

      logger.debug(`Adding route ${method.toUpperCase()} "${baseUrl}"`);
      router[method].apply(router, routerArgs);
    } else if (item.length && item[0] === '/') {
      // if its not a method and it starts with a /, we assume it is a nested set of routes
      const url = baseUrl !== '/' ? (baseUrl + item) : item;

      addRoutes(router, url, routeMethods[item]);
    } else {
      // if its not any of that, we warn the user of an invalid key
      logger.warn(`An invalid key, "${item}", exists on route object at path "${baseUrl}"`);
    }
  }
}

function makeExpressPath(url) {
  if (!url || !url.length) {
    return '/';
  }

  return url.replace(/\/_([^/]+)/g, function(match, p) {
    // if it is two underscores, then it is not a path parameter
    if (p[0] === '_') {
      return '/' + p;
    }

    // otherwise, it is a path parameter
    return '/:' + p;
  });
}

module.exports = createAllRoutes;
