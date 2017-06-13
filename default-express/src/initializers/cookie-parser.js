const cookieParser = require('cookie-parser');

module.exports = function(app) {
  app.use(cookieParser());
};
