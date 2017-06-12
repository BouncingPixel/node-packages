const mime = require('mime');
const typeis = require('type-is');

module.exports = function checkFileMimeFactory(mimetype, allowConversion) {
  const mimetypes = Array.isArray(mimetype) ? mimetype : [mimetype];
  const allowConversions = Array.isArray(allowConversion) ? allowConversion : [allowConversion];

  return function checkIfFileInvalid(file) {
    const originalMime = mime.lookup(file.filename);

    if (allowConversion === true) {
      return true;
    }

    return typeis.is(originalMime, mimetypes) || typeis.is(originalMime, allowConversions);
  };
};
