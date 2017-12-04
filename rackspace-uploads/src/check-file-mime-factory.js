const mime = require('mime');

// returns false if the mime type is VALID
// it's the opposite of what one would expect, but it's used to get invalids
module.exports = function checkFileMimeFactory(mimetypes, allowConversion) {
  if (!mimetypes || !mimetypes.length) {
    return function() {
      // false, because all are valid
      return false;
    };
  }

  return function checkIfFileInvalid(file) {
    const originalMime = mime.lookup(file.filename);

    if (!allowConversion) {
      if (Array.isArray(mimetypes)) {
        if (mimetypes.indexOf(originalMime) === -1) {
          // true, because the file isnt in the list of valid mimetypes
          return true;
        }
      } else if (mimetypes !== originalMime) {
        return true;
      }
    } else if (Array.isArray(allowConversion) && allowConversion.length > 0) {
      // check to see if we allow conversion to this file type
      if (allowConversion.indexOf(originalMime) === -1) {
        // true, because we cant convert to the other mimetype
        return true;
      }
    }

    // probably not invalid, so return false
    return false;
  };
};
