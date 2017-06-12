const fs = require('fs');
const path = require('path');

let express = require('express');
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
      if (!endsWith(dir, '.js')) {
        return;
      }

      const checkIndexStr = path.sep + 'index.js';
      const isIndex = endsWith(dir, checkIndexStr);

      const substrEnd = dir.length - (isIndex ? checkIndexStr.length : 3);
      const url = dir.substr(0, substrEnd);

      const parameterizedUrl = makeExpressPath(url);

      const routeMethods = require(fullDir);

      if (routeMethods) {
        if (Object.getPrototypeOf(routeMethods) === express.Router) {
          logger.debug(`Adding middleware via use to "${parameterizedUrl}"`);
          router.use(parameterizedUrl, routeMethods);
        } else {
          const before = makeSureIsArray(routeMethods.before);
          const after = makeSureIsArray(routeMethods.after);

          addRoutes(router, parameterizedUrl, routeMethods, before, after);
        }
      }
    }
  });
}

function addRoutes(router, baseUrl, routeMethods, parentBefore, parentAfter) {
  for (const item in routeMethods) {
    if (methods.indexOf(item) !== -1) {
      // if it is a method, then we mount it to the URL
      const method = item;
      const routeInfo = routeMethods[method];

      const before = makeSureIsArray(routeInfo.before);

      // defaulting to empty array as a way to exclude from .concat
      const handler = (routeInfo instanceof Function ? routeInfo : routeInfo.handler) || [];
      const after = makeSureIsArray(routeInfo.after);

      const routerArgs = [baseUrl]
        .concat(parentBefore)
        .concat(before)
        .concat(handler)
        .concat(after)
        .concat(parentAfter);

      if (routerArgs.length === 1) {
        logger.warn(`A route, "${baseUrl}", may not be performing any action due to missing handler, before, and/or after`);
      }

      logger.debug(`Adding route ${method.toUpperCase()} "${baseUrl}"`);
      router[method].apply(router, routerArgs);
    } else if (item === 'use') {
      router.use(baseUrl, routeMethods.use);
    } else if (item.length && item[0] === '/') {
      // if its not a method and it starts with a /, we assume it is a nested set of routes
      const url = baseUrl !== '/' ? (baseUrl + item) : item;
      const before = makeSureIsArray(routeMethods.before);
      const after = makeSureIsArray(routeMethods.after);

      addRoutes(router, url, routeMethods[item], parentBefore.concat(before), after.concat(parentAfter));
    } else if (item === 'before' || item === 'after') {
      // we can safely ignore these two
    } else {
      // if its not any of that, we warn the user of an invalid key
      logger.warn(`An invalid key, "${item}", exists on route object at path "${baseUrl}"`);
    }
  }
}

function endsWith(str, ending) {
  if (str.length < ending.length) {
    return false;
  }

  return str.substring(str.length - ending.length) === ending;
}

function makeSureIsArray(item) {
  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function makeExpressPath(url) {
  if (!url || !url.length) {
    return '/';
  }

  // normalize backslash to forward slash, change /__ to _ and /_ to /:
  return url.replace(/\\/g, '/').replace(/\/_([^/]+)/g, function(match, p) {
    // if it is two underscores, then it is not a path parameter
    if (p[0] === '_') {
      return '/' + p;
    }

    // otherwise, it is a path parameter
    return '/:' + p;
  });
}

module.exports = createAllRoutes;
