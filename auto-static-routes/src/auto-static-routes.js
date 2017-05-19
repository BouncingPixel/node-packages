const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('winston');

const renderPage = require('./render-page');

// this one is used in production
function createAllStaticRoutes(baseViewsDir, directoryName) {
  // create an express router
  const router = express.Router();

  // go through list of files and add routes for each of them
  const staticDir = path.join(baseViewsDir, directoryName);
  addRoutesInDir(staticDir, directoryName, '/', router);

  // we return the router, even though this is async and the router is filled later
  // express is fine with this
  return router;
}

// no callback as it doesn't really matter. we don't notify anything that we are done
function addRoutesInDir(baseDir, directoryName, dir, router) {
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
      // make sure it ends in .dust
      if (dir.lastIndexOf('.dust') !== (dir.length - 5)) {
        return;
      }

      const isIndex = dir.lastIndexOf('/index.dust') === (dir.length - 11);
      const url = isIndex ? dir.substr(0, dir.length - 11) : dir.substr(0, dir.length - 5);

      router.get(url, renderPage(path.join(directoryName, url)));
    }
  });
}

// this one is used in dev
function createStaticHandler(baseViewsDir, directoryName) {
  return function(req, res, next) {
    // also, make sure if it ends in a slash, then use index.dust
    const hasEndingSlash = req.path[req.path.length - 1] === '/';
    const urlpath = directoryName + '/' + req.path.substr(1) + (hasEndingSlash ? 'index' : '');

    // security: make sure someone doesnt navigate out of the top folder with urlpath
    if (urlpath.indexOf('/./') !== -1 || urlpath.indexOf('/../') !== -1) {
      next();
      return;
    }

    const fallback = hasEndingSlash ? null : (urlpath + '/index');

    // check if dust file exists
    attemptRender(baseViewsDir, urlpath, fallback, function(err, toRender) {
      if (err || !toRender) {
        next();
        return;
      }

      res.render(urlpath);
    });
  };
}

function attemptRender(baseViewsDir, urlpath, fallback, done) {
  const pagePath = path.resolve(baseViewsDir, urlpath + '.dust');

  // check if dust file exists
  fs.access(pagePath, fs.constants.R_OK, (err) => {
    // if not, then next();
    if (err) {
      if (fallback) {
        attemptRender(baseViewsDir, fallback, null, done);
        return;
      }

      // don't actually show the error, just let the 404 take over
      done(err);
      return;
    }

    // if it does, render it
    done(null, urlpath);
  });
}

module.exports = process.env.NODE_ENV === 'production' ? createAllStaticRoutes : createStaticHandler;
