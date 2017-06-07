const path = require('path');
const fs = require('fs');
const resolvePath = require('resolve-path');

const makeSureExtHasDot = require('./extension-dot');

function createDynamicRouter(baseViewsDir, directoryName, ext) {
  const extension = makeSureExtHasDot(ext);
  const pageDir = path.join(baseViewsDir, directoryName);

  return function(req, res, next) {
    if (req.method.toLowerCase() !== 'get') {
      next();
      return;
    }

    let safeUrl = null;

    try {
      safeUrl = resolvePath(
        pageDir,
        req.path.substring(1)
      ).substring(pageDir.length + 1);
    } catch (_e) {
      next();
      return;
    }

    const urlParts = safeUrl.split('/');

    scanDirectory(urlParts, pageDir, extension).then((pageInfo) => {
      for (const prop in pageInfo.params) {
        let value = pageInfo.params[prop];
        if (value === '') {
          value = undefined;
        }
        req.params[prop] = value;
      }

      res.render(directoryName + '/' + pageInfo.path);
    }).catch(() => {
      next();
    });
  };
}

// for the dynamic one:
// split directories
// for each directory:
//    check if directory name exists
//    or try any directory that starts with _ (param)
// keep trying to get a match using a DFS
    // for each path part:
    //     get the exact directory, that is a possible one
    //     get any _param directories, those are possibilities too
    //     if it is the last path component, then we can try /index
    // first match is the one that is rendered. replicates how static works

function scanDirectory(remainingPath, directory, extension) {
  if (!remainingPath || !remainingPath.length) {
    return Promise.reject();
  }

  const isLastPath = remainingPath.length === 1;
  const nextComponent = remainingPath[0];

  let promise = null;
  if (isLastPath) {
    // check for the dir/index.ext first
    const indexPath = 'index' + extension;

    promise = fsAccess(
      path.join(directory, nextComponent, indexPath)
    ).then(function() {
      return {
        path: nextComponent === '' ? indexPath : [nextComponent, indexPath].join('/'),
        params: {}
      };
    }).catch(function() {
      // wasnt index, but it was the last one, so might be nextComponent.ext
      return fsAccess(
        path.join(directory, nextComponent + extension)
      ).then(function() {
        return {
          path: nextComponent + extension,
          params: {}
        };
      });
    });

    // if the last component is empty, then ends in slash.
    // no need to check the rest. it *must* be ...
    // though, what about optionals? /blog/:slug? and :slug may be undefined?
    if (nextComponent === '') {
      return promise;
    }
  } else {
    if (nextComponent === '') {
      return scanDirectory(
        remainingPath.slice(1),
        directory,
        extension
      );
    }

    promise = fsAccess(path.join(directory, nextComponent)).then(function() {
      return scanDirectory(
        remainingPath.slice(1),
        path.join(directory, nextComponent),
        extension
      ).then(function(pageInfo) {
        pageInfo.path = nextComponent + '/' + pageInfo.path;
        return pageInfo;
      });
    });
  }

  // otherwise, we first check for exact directory.
  // if that fails, then we scan the directory for anything that starts with _ and try those
  // if it was the last one, there's two possibilities:
  //    it's a file, or its a directory
  return promise.catch(function() {
    // if we still didnt find something, we need to check for _param
    return fsReadDir(directory).then(function(files) {
      const paramFiles = files.filter(file => {
        // also filter out files if it's not the last path
        return file.length > 1 && file[0] === '_' &&
          (!isLastPath || file.substring(file.length - extension.length) === extension);
      });

      if (!paramFiles.length) {
        return Promise.reject();
      }

      const paramValue = nextComponent;

      // we go until we find one that matches. otherwise, reject.
      // this is like the Promise-series, but with rejects instead of resolves.
      let current = Promise.reject();

      paramFiles.forEach(function(file) {
        const paramName = file.slice(1);

        current = current.catch(function() {
          // if its the last one:
          //    if it is a directory, then check for index.ext
          //    if it is a viewfile .ext file: then return the view file
          // else (not the last one)
          //    then keep trying to match
          if (isLastPath) {
            return isPathDirectory(path.join(directory, file)).then((isDirectory) => {
              if (isDirectory) {
                return fsAccess(
                  path.join(directory, file, 'index' + extension)
                ).then(function() {
                  return {
                    path: file + '/index' + extension,
                    params: {
                      [paramName]: paramValue
                    }
                  };
                });
              } else if (file.substring(file.length - extension.length) === extension) {
                const realParamName = file.substring(1, file.length - extension.length);
                // then use this
                return {
                  path: file,
                  params: {
                    [realParamName]: paramValue
                  }
                };
              } else {
                return Promise.reject();
              }
            });
          } else {
            return scanDirectory(
              remainingPath.slice(1),
              path.join(directory, file),
              extension
            ).then(function(pageInfo) {
              pageInfo.path = file + '/' + pageInfo.path;
              pageInfo.params[paramName] = paramValue;
              return pageInfo;
            });
          }

        });
      });

      return current;

    });
  });
}

// some Promise wrappers around fs functions
function fsReadDir(dir) {
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

function fsAccess(pagePath) {
  return new Promise(function(resolve, reject) {
    fs.access(pagePath, fs.constants.R_OK, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(pagePath);
      }
    });
  });
}

function isPathDirectory(file) {
  return new Promise(function(resolve, reject) {
    fs.stat(file, function(err, stats) {
      if (err) {
        reject(err);
      } else {
        resolve(stats.isDirectory());
      }
    });
  });
}

module.exports = createDynamicRouter;
