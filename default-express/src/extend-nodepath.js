const path = require('path');

module.exports = function() {
  const oldPath = process.env.NODE_PATH && process.env.NODE_PATH.length ?
    process.env.NODE_PATH.split(path.delimiter) :
    [];

  const updatedPath = oldPath.concat(process.cwd());

  process.env.NODE_PATH = updatedPath.join(path.delimiter);
  require('module').Module._initPaths();
};
