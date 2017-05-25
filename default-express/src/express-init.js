// do the configuration bits that are static to all servers

// get the requires out of the way
const nconf = require('nconf');

const path = require('path');

const bodyParser = require('body-parser');
const compression = require('compression');
const cons = require('consolidate');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressWinston = require('express-winston');
const flash = require('connect-flash');
const session = require('express-session');
const winston = require('winston');

let databaseAdapter = null;
let authAdapter = null;
try {
  databaseAdapter = require('@bouncingpixel/mongoose-db');
} catch (_e) {
  databaseAdapter = null;
}
try {
  authAdapter = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  authAdapter = null;
}

const app = express();

winston.debug('Configuring express for dust using consolidate');
// require in our custom helpers, will expose them to dust for us
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', 'views');

// needed for Heroku to get the client's IP address from req.ips[req.ips.length-1]
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
}

// pre-initialize the dust renderer. necessary because it's possible we send an email before someone loads a page
cons.dust.render('notatemplate', {
  ext: app.get('view engine'),
  views: path.resolve(process.cwd(), app.get('views'))
}, function() { /* we don't care about the return, it's an error anyway. but Dust is ready now */ });
require('@bouncingpixel/dust-helpers')(cons.requires.dust);


// don't expose we use Express. need to know basis
app.set('x-powered-by', false);

// compression should be before the statics and other routes
app.use(compression());

require('./webpack-dev')(app);
require('./webtools-verifier')(app);

winston.debug('Creating client side config in /js/config.js');
app.get('/js/config.js', require('./client-config'));

winston.debug('Configuring routes for statics');
app.use(express.static('public'));

// require in the bits from the app

// redirect
app.use(require('./force-redirects'));

winston.debug('Configuring util functions');
app.use(require('@bouncingpixel/universal-response'));

winston.debug('Setting up session store');
const sessionStore = databaseAdapter ?
  databaseAdapter.getSessionStore(session) : (new session.MemoryStore());

winston.silly('Configuring middlewares');
app.use(cookieParser());
app.use(session({
  store: sessionStore,
  secret: nconf.get('sessionSecret'),
  resave: true,
  saveUninitialized: true
}));

app.use(flash());

if (authAdapter) {
  authAdapter.init(app);
}

app.use(require('./set-locals'));

// set up logging of express handling
app.use(expressWinston.logger({
  winstonInstance: winston,
  statusLevels: true,
  expressFormat: true,
  msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms '
}));

// urlencoded is needed for standard forms. jquery can send urlencoded as well.
// there's also jsonencoded which is useful for other XHR requests. both can be enabled at the same time.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(require('./security'));

module.exports = app;
