const mongoose = require('mongoose');
const imgixparam = require('./imgixparam');
const RackspaceService = require('@bouncingpixel/rackspace-uploads');

// now what about validation? mimetypes, max size, etc?
const imgixsetSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    minlength: 1,
    set: function(path) {
      if (path === this.path) {
        // nothing changed, so do nothing
        return path;
      }

      // need to remember the original to be removed
      if (this._pathsToRemove == null) {
        this._pathsToRemove = [this.path];
      } else {
        // check if we are adding back an old one
        const index = this._pathsToRemove.indexOf(path);

        if (index === -1) {
          this._pathsToRemove.push(this.path);
        } else {
          this._pathsToRemove.splice(index, 1);
        }
      }

      return path;
    }
  },

  derivatives: [{
    name: {
      type: String,
      required: true
    },

    imgixParams: [imgixparam]
  }]
});

function removeAllPaths(paths) {
  // only remove the old one if image was modified and we have the original url
  if (paths == null || paths.length === 0) {
    return Promise.resolve();
  }

  let current = Promise.resolve();

  paths.forEach(function(imgPath) {
    current = current.then(function() {
      return RackspaceService.removeFileAsync(imgPath);
    });
  });

  return current;
}

// TODO:
// get uploader settings

// using the pre-save to remove previous images from rackspace
imgixsetSchema.pre('save', function(next) {
  removeAllPaths(this._pathsToRemove).then(function() {
    next();
  }).catch(next);
});

imgixsetSchema.pre('remove', function(next) {
  removeAllPaths([this.path]).then(function() {
    next();
  }).catch(next);
});

imgixsetSchema.method.getDerivative = function getDerivative(name) {
  if (!this.derivatives || !this.derivatives.length) {
    return null;
  }

  return this.derivatives.find(function(d) {
    return d.name === name;
  });
};

imgixsetSchema.paramsOfDerivative = function paramsOfDerivative(derivative) {
  if (!derivative || !derivative.imgixParams || !derivative.imgixParams.length) {
    return {};
  }

  let params = {};

  derivative.imgixParams.forEach(function(paramInfo) {
    params[paramInfo.name] = paramInfo.value;
  })

  return params;
};

module.exports = imgixsetSchema;
