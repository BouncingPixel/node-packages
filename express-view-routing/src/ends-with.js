module.exports = function endsWith(str, ending) {
  if (str.length < ending.length) {
    return false;
  }

  return str.substring(str.length - ending.length) === ending;
};
