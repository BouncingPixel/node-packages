const flash = require('connect-flash');

module.exports = function(app) {
  app.use(flash());
};
