const nconf = require('nconf');
const winston = require('winston');

module.exports = function(app) {
  const port = nconf.get('PORT');

  app.listen(port, function() {
    winston.info(`App listening on port ${port}`);
  });
};
