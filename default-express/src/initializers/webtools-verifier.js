const nconf = require('nconf');

function initWebtools(app) {
  const webtoolsVerifId = nconf.get('WEBTOOLS_VERIF_ID');
  const fileName = `/${webtoolsVerifId}.html`;
  const fileContents = `google-site-verification: ${webtoolsVerifId}.html`;

  app.get(fileName, function(req, res) {
    res.status(200).send(fileContents);
  });
}

function doNothing() {
}

module.exports = nconf.get('WEBTOOLS_VERIF_ID') ? initWebtools : doNothing;
