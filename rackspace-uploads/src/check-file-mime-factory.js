const mime = require('mime');

module.exports = function checkFileMimeFactory(mimetypes, allowConversion) {
  if (!mimetypes || !mimetypes.length) {
    return function() {
      return true;
    };
  }

  return function checkIfFileInvalid(file) {
    const originalMime = mime.lookup(file.filename);

    if (!allowConversion) {
      if (Array.isArray(mimetypes)) {
        if (mimetypes.indexOf(originalMime) === -1) {
          return true;
        }
      } else if (mimetypes !== originalMime) {
        return true;
      }
    } else if (Array.isArray(allowConversion) && allowConversion.length > 0) {
      // check to see if we allow conversion to this file type
      if (allowConversion.indexOf(originalMime) === -1) {
        return true;
      }
    }

    return false;
  };
};
