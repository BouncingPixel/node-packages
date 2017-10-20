'use strict';

module.exports = function ReplaceImage(schema, initOptions) {
  if (!initOptions || !initOptions.fields || !Array.isArray(initOptions.fields)) {
    throw new Error('Init options are required with "fields" set to an array of fields to auto-bcrypt');
  }
  if (!initOptions.remover || typeof initOptions.remover !== 'function') {
    throw new Error('Options must have "remover" set to the function which removes the image');
  }

  var fields = initOptions.fields;
  var remover = initOptions.remover;

  fields.forEach(function(field) {
    // TODO: what about an array of images?
    var schemaPath = schema.path(field);

    schemaPath.set(function(value) {
      // need to remember the original to be removed
      if (!this._imgsToRemember) {
        this._imgsToRemember = {};
      }

      if (this._imgsToRemember[field] === undefined && value !== this[field]) {
        this._imgsToRemember[field] = this[field] || null;
      }

      return value;
    });
  });

  schema.pre('save', function(next) {
    var item = this;

    var cachedFieldKeys = Object.keys(item._imgsToRemember);

    // only hash the password if it has been modified (or is new)
    if (!cachedFieldKeys.length) {
      return next();
    }

    var index = 0;
    function nextField(err) {
      if (err || index >= cachedFieldKeys.length) {
        return next(err);
      }

      var fieldKey = cachedFieldKeys[index++];
      var image = item._imgsToRemember[fieldKey];

      remover(image, nextField);
    }
    nextField();
  });

  schema.pre('remove', function(next) {
    const item = this;

    var index = 0;
    function nextField(err) {
      if (err || index >= fields.length) {
        return next(err);
      }

      var fieldKey = fields[index++];
      var image = item[fieldKey];

      if (image) {
        remover(image, nextField);
      } else {
        nextField();
      }
    }
    nextField();
  });
};
