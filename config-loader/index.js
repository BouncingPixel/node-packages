const fs = require('fs');
const nconf = require('nconf');
const path = require('path');
const winston = require('winston');

module.exports = function configLoader(configPath) {
  nconf.argv().env('__');

  try {
    const configFiles = fs.readdirSync(configPath);

    let hasLocalJson = false;
    let hasLocalJs = false;
    let hasDefaultJson = false;
    let hasDefaultJs = false;

    configFiles.forEach((file) => {
      if (file === 'local.json') {
        // we load the local.js(on) files after all others
        hasLocalJson = true;
      } else if (file === 'local.js') {
        hasLocalJs = true;
      } else if (file === 'defaults.json') {
        hasDefaultJson = true;
      } else if (file === 'defaults.js') {
        hasDefaultJs = true;
      } else if (endsWith(file, '.json') || endsWith(file, '.js')) {
        winston.info(`Loading config: '${file}'`);

        nconf.use(file, {
          type: 'literal',
          store: require(path.join(configPath, file))
        });
      }
    });

    // load the defaults with the JS taking priority over the JSON
    if (hasDefaultJson) {
      winston.info('Loading config: \'defaults.json\'');
      nconf.defaults(require(path.join(configPath, 'defaults.json')));
    }
    if (hasDefaultJs) {
      winston.info('Loading config: \'defaults.js\'');
      nconf.defaults(require(path.join(configPath, 'defaults.js')));
    }

    // make sure the local.js(on) files are loaded as overrides
    if (hasLocalJson) {
      winston.info('Loading config: \'local.json\'');
      nconf.overrides(require(path.join(configPath, 'local.json')));
    }
    if (hasLocalJs) {
      winston.info('Loading config: \'local.js\'');
      nconf.overrides(require(path.join(configPath, 'local.js')));
    }
  } catch (e) {
    winston.error('Unable to load config');
    return Promise.reject(e);
  }

  nconf.use('memory');

  if (nconf.get('logLevel')) {
    winston.level = nconf.get('logLevel');
  }
};

function endsWith(str, ending) {
  if (str.length < ending.length) {
    return false;
  }

  return str.substring(str.length - ending.length) === ending;
}
