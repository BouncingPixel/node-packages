const expressWinston = require('express-winston');
const winston = require('winston');

module.exports = function(app) {
  // set up logging of express handling
  app.use(expressWinston.logger({
    winstonInstance: winston,
    statusLevels: true,
    expressFormat: true,
    meta: false,
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms '
  }));
};
