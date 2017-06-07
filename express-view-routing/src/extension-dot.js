module.exports = function makeSureExtHasDot(extension) {
  if (!extension || !extension.length) {
    throw new Error('Must have a valid extension for view files');
  }

  if (extension[0] === '.') {
    return extension;
  }

  return '.' + extension;
};
