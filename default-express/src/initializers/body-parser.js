const bodyParser = require('body-parser');

module.exports = function(app) {
  // urlencoded is needed for standard forms. jquery can send urlencoded as well.
  // there's also jsonencoded which is useful for other XHR requests. both can be enabled at the same time.
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
};
