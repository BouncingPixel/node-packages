const winston = require('winston');
const nconf = require('nconf');

const webpackConfigPath = nconf.get('webpackConfigPath');

function initWebpackDev(app) {
  winston.debug('Configuring webpack-dev-middleware');

  try {
    const webpack = require('webpack');
    const webpackconfig = require(webpackConfigPath);
    const webpackcompiler = webpack(webpackconfig);

    const devMiddlewareInst = require('webpack-dev-middleware')(webpackcompiler, {
      publicPath: webpackconfig.output.publicPath
    });

    app.use(devMiddlewareInst);
  } catch (_e) {
    // do nothing, it's not a disaster if it doesnt work
  }
}

function doNothing() {
  // we do nothing in production mode
}

module.exports = process.env.NODE_ENV !== 'production' && webpackConfigPath ?
  initWebpackDev : doNothing;