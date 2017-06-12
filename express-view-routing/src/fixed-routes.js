const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('winston');

const endsWith = require('./ends-with');
const makeSureExtHasDot = require('./extension-dot');
const renderPage = require('./render-page');

// this one is used in production
function createFixedRouter(baseViewsDir, directoryName, extension) {
  // create an express router
  const router = express.Router();

  // go through list of files and add routes for each of them
  const staticDir = path.join(baseViewsDir, directoryName);
  addRoutesInDir(staticDir, directoryName, '/', router, makeSureExtHasDot(extension));

  // we return the router, even though this is async and the router is filled later
  // express is fine with this
  return router;
}

// no callback as it doesn't really matter. we don't notify anything that we are done
function addRoutesInDir(baseDir, directoryName, dir, router, extension) {
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
          addRoutesInDir(baseDir, directoryName, path.join(dir, file), router, extension);
        });
      });
    } else {
      const extLength = extension.length;

      // make sure it ends in the extension
      if (!endsWith(dir, extension)) {
        return;
      }

      const checkIndexStr = path.sep + 'index' + extension;
      const isIndex = endsWith(dir, checkIndexStr);

      const substrEnd = dir.length - (isIndex ? checkIndexStr.length : extLength);
      const url = dir.substr(0, substrEnd);

      const parameterizedUrl = makeExpressPath(url);

      router.get(parameterizedUrl, renderPage(path.join(directoryName, url)));
    }
  });
}

function makeExpressPath(url) {
  if (!url || !url.length) {
    return '/';
  }

  return url.replace(/\\/g, '/').replace(/\/_([^/]+)/g, function(match, p) {
    // if it is two underscores, then it is not a path parameter
    if (p[0] === '_') {
      return '/' + p;
    }

    // otherwise, it is a path parameter
    return '/:' + p;
  });
}

module.exports = createFixedRouter;
