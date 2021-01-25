'use strict';

var bcrypt = require('bcryptjs');

module.exports = function AutoBcrypt(schema, initOptions) {
  if (!initOptions || !initOptions.fields || !Array.isArray(initOptions.fields)) {
    throw new Error('Init options are required with "fields" set to an array of fields to auto-bcrypt');
  }

  var fields = initOptions.fields;
  var bcryptRounds = initOptions.rounds || 10;

  schema.pre('save', function(next) {
    var item = this;

    var anyModified = fields.some(function(field) {
      return item.isModified(field);
    });
    // only hash the password if it has been modified (or is new)
    if (!anyModified) {
      return next();
    }

    var index = 0;
    function nextField(err) {
      if (err || index >= fields.length) {
        return next(err);
      }

      var field = fields[index++];
      bcrypt.hash(item[field], bcryptRounds, function(err, hash) {
        if (err) {
          return nextField(err);
        }

        item[field] = hash;
        nextField();
      });
    }
    nextField();
  });
};
