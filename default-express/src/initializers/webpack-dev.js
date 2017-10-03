const winston = require('winston');
const nconf = require('nconf');
const AnsiToHtml = require('ansi-to-html');
const ansiConverter = new AnsiToHtml({
  colors: {
    0: '#000',
    1: '#A00',
    2: '#0A0',
    3: '#A90',
    4: '#00A',
    5: '#A0A',
    6: '#0AA',
    7: '#AAA',
    8: '#999',
    9: '#F99',
    10: '#9F9',
    11: '#FF9',
    12: '#99F',
    13: '#F9F',
    14: '#9FF',
    15: '#FFF'
  }
});

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
    serverSideRender: true,
    lazy: true
  });

  app.use(function(req, res, next) {
    devMiddlewareInst(req, res, function() {
      const webstats = res.locals.webpackStats;
      if (!webstats) {
        // not an error, just webpack may not have ran yet
        return next();
      }

      const stats = webstats.toJson('errors-only');

      if (stats && stats.errors.length) {
        const errors = stats.errors.map(e => `<pre>${ansiConverter.toHtml(e)}</pre>`);

        res.send(`<html><head><title>Error</title><style>body {background-color:#000;color:#fff;font-size:14px;line-height:20px;}</style></head><body> ${errors.join('<hr><br>')} </body></html>`);
        return;
      }

      next();
    });
  });
}

function doNothing() {
  // we do nothing in production mode
}

module.exports = process.env.NODE_ENV !== 'production' && webpackConfigPath ?
  initWebpackDev : doNothing;
