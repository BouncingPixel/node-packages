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

const lastErrorsByDir = {};

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
    lazy: true,
    noInfo: true
  });

  // have to add each separately to get them all to work
  app.use(function(req, res, next) {
    // also, need to do this to get the errors from the individual parts
    // otherwise webpackStats is always just the last-run one
    devMiddlewareInst(req, res, function() {
      const webstats = res.locals.webpackStats;
      if (!webstats) {
        // not an error, just webpack may not have ran yet
        return next();
      }

      const stats = webstats.toJson({
        assets: false,
        cached: false,
        cachedAssets: false,
        children: false,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        colors: true,
        depth: false,
        entrypoints: false,
        errors: true,
        errorDetails: true,
        hash: false,
        modules: false,
        publicPath: true,
        reasons: false,
        source: false,
        timings: false,
        usedExports: false,
        version: false,
        warnings: false
      });

      if (stats) {
        if (stats.errors.length) {
          const errors = stats.errors.map(e => `<pre>${ansiConverter.toHtml(e)}</pre>`);
          lastErrorsByDir[stats.publicPath] = errors;
        } else {
          lastErrorsByDir[stats.publicPath] = null;
        }
      }

      next();
    });
  });

  app.get('/devwebpackerrors/:publicPath', function(req, res) {
    const errors = lastErrorsByDir[`/${req.params.publicPath}/`] || null;
    res.send({errors: errors});
  });
}

function doNothing() {
  // we do nothing in production mode
}

module.exports = process.env.NODE_ENV !== 'production' && webpackConfigPath ?
  initWebpackDev : doNothing;
