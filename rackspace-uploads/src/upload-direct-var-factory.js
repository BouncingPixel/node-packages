'use strict';

const nconf = require('nconf');
const crypto = require('crypto');

const rackspaceContainer = nconf.get('rackspaceContainer');
const rackspaceMosso = nconf.get('rackspaceMosso');
const rackspaceHmacKey = nconf.get('rackspaceHmacKey');

module.exports = function(options) {
  const redirectTo = options.redirectTo;
  const fileNameFactory = options.fileNameFactory;
  const maxSize = options.maxSize || 10485760; // in bytes
  const expireAfter = options.expires || 15; // in minutes

  return function(req, res, next) {
    const uploadPath = '/v1/' + rackspaceMosso + '/' + rackspaceContainer + '/' + fileNameFactory(req);
    const redirectUrl = req.protocol + '://' + req.get('Host') + '/' + redirectTo;

    const expiresDate = new Date();
    expiresDate.setMinutes(expires.getMinutes() + expireAfter);
    const expires = parseInt((expiresDate.getTime() / 1000), 10);

    const toHmac = [uploadPath, redirectUrl, maxSize, '1', expires].join('\n');

    const hmac = crypto.createHmac('sha1', rackspaceHmacKey);
    hmac.setEncoding('hex');
    hmac.write(toHmac);
    hmac.end();
    const hash = hmac.read();

    res.locals.directUploadInfo = {
      path: uploadPath,
      redirectUrl: redirectUrl,
      maxSize: maxSize,
      expires: expires,
      hmac: hash
    };

    next();
  };
};
