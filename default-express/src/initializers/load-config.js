const fs = require('fs');
const nconf = require('nconf');
const path = require('path');
const winston = require('winston');

module.exports = function() {
  nconf.argv().env();

  try {
    const configPath = path.resolve(process.cwd(), 'config');
    const configFiles = fs.readdirSync(configPath);

    let hasLocalJs = false;
    let hasLocalJson = false;

    configFiles.forEach((file) => {
      if (file === 'local.json') {
        // we load the local.js(on) files after all others
        hasLocalJson = true;
      } else if (file === 'local.js') {
        hasLocalJs = true;
      } else if (endsWith(file, '.json') || endsWith(file, '.js')) {
        winston.info(`Loading config: '${file}'`);

        nconf.use(file, {
          type: 'literal',
          store: require(path.join(configPath, file))
        });
      }
    });

    // make sure the local.js(on) files are loaded last
    if (hasLocalJson) {
      winston.info('Loading config: \'local.json\'');

      nconf.use('local.json', {
        type: 'literal',
        store: require(path.join(configPath, 'local.json'))
      });
    }
    if (hasLocalJs) {
      winston.info('Loading config: \'local.js\'');

      nconf.use('local.js', {
        type: 'literal',
        store: require(path.join(configPath, 'local.js'))
      });
    }
  } catch (e) {
    winston.error('Unable to load config');
    return Promise.reject(e);
  }

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
