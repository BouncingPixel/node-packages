const fs = require('fs');
const path = require('path');

const logger = require('winston');
const methods = require('methods');

// this one is used in production
function createAllRoutes(app) {
  const baseViewsDir = app.get('routes-dir');

  // go through list of files and add routes for each of them. this is done synchronously
  const staticDir = path.join(baseViewsDir);
  addRoutesInDir(staticDir, '/', app);
}

// no callback as it doesn't really matter. we don't notify anything that we are done
function addRoutesInDir(baseDir, dir, app) {
  const fullDir = path.join(baseDir, dir);

  try {
    const stats = fs.statSync(fullDir);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullDir);

      files.forEach(function(file) {
        addRoutesInDir(baseDir, path.join(dir, file), app);
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
        const before = makeSureIsArray(routeMethods.before);
        const after = makeSureIsArray(routeMethods.after);
        const zones = makeSureIsArray(routeMethods.zones);

        addRoutes(app, parameterizedUrl, routeMethods, before, after, zones);
      }
    }
  } catch (e) {
    logger.warn(e);
    return;
  }
}

function addRoutes(app, baseUrl, routeMethods, parentBefore, parentAfter, parentZones) {
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

      logger.silly(`Adding route ${method.toUpperCase()} "${baseUrl}"`);

      let mountLocation = app;
      if (app.zone) {
        const defaultZone = app.get('router-defaultzone');
        if (parentZones.length) {
          mountLocation = app.zone(parentZones.join(' '));
        } else if (defaultZone) {
          mountLocation = app.zone(defaultZone);
        }
      }

      mountLocation[method].apply(mountLocation, routerArgs);
    } else if (item === 'use') {
      app.use(baseUrl, routeMethods.use);
    } else if (item.length && item[0] === '/') {
      // if its not a method and it starts with a /, we assume it is a nested set of routes
      const url = baseUrl !== '/' ? (baseUrl + item) : item;
      const before = makeSureIsArray(routeMethods.before);
      const after = makeSureIsArray(routeMethods.after);
      const zones = makeSureIsArray(routeMethods.zones);

      addRoutes(
        app,
        url,
        routeMethods[item],
        parentBefore.concat(before),
        after.concat(parentAfter),
        parentZones.concat(zones)
      );
    } else if (item === 'before' || item === 'after' || item === 'zone') {
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
