const nconf = require('nconf');

const hashJsonFiles = loadConfig();

const fileHashes = {};

module.exports = function(app) {
  hashJsonFiles.forEach(function(hashFile) {
    try {
      const hashes = require(hashFile).fileHashes;
      for (let p in hashes) {
        fileHashes[p] = hashes[p].substr(0, 8);
      }
    } catch (_e) {
      // no worries on the error
    }
  });

  app.use(function(req, res, next) {
    if (res.locals.webpackStats) {
      const chunks = res.locals.webpackStats.toJson().chunks;

      chunks.forEach(function(chunk) {
        chunk.files.forEach(function(file) {
          fileHashes[file] = chunk.hash.substr(0, 8);
        });
      });
    }

    res.locals.fileHashes = fileHashes;
    next();
  });
};

function loadConfig() {
  const config = nconf.get('hashJsonFiles');

  if (!config) {
    return [];
  }

  if (Array.isArray(config)) {
    return config;
  }

  return config.split(',');
}
