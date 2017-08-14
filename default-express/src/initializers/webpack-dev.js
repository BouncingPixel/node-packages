const winston = require('winston');
const nconf = require('nconf');

const webpackConfigPath = nconf.get('webpackConfigPath');

function initWebpackDev(app) {
  winston.debug('Configuring webpack-dev-middleware');

  try {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');

    const webpackconfig = require(webpackConfigPath);

    if (Array.isArray(webpackconfig)) {
      webpackconfig.forEach(function(config) {
        makeMiddleware(app, webpack, webpackDevMiddleware, config);
      });
    } else {
      makeMiddleware(app, webpack, webpackDevMiddleware, webpackconfig);
    }
  } catch (_e) {
    // do nothing, it's not a disaster if it doesnt work
  }
}

function makeMiddleware(app, webpack, webpackDevMiddleware, config) {
  const webpackcompiler = webpack(config);

  const devMiddlewareInst = webpackDevMiddleware(webpackcompiler, {
    publicPath: config.output.publicPath,
    serverSideRender: true
  });

  app.use(devMiddlewareInst);
}

function doNothing() {
  // we do nothing in production mode
}

module.exports = process.env.NODE_ENV !== 'production' && webpackConfigPath ?
  initWebpackDev : doNothing;
