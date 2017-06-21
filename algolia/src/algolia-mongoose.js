'use strict';

const algoliasearch = require('algoliasearch');
const nconf = require('nconf');
const logger = require('winston');

const NotFoundError = require('@bouncingpixel/http-errors').NotFoundError;

const algoliaIndexPrefix = nconf.get('client:algoliaIndexPrefix');

const client = (nconf.get('client:algoliaAppId') && nconf.get('algoliaApiKey')) ?
  algoliasearch(nconf.get('client:algoliaAppId'), nconf.get('algoliaApiKey')) :
  null;

const indecies = {};

function getIndex(modelName) {
  if (!indecies[modelName]) {
    indecies[modelName] = client.initIndex(algoliaIndexPrefix + '_' + modelName);
  }

  return indecies[modelName];
}

function defaultIncludeInIndex(obj) {
  return obj ? true : null;
}

function defaultCastToObject(obj) {
  if (!obj) {
    return obj;
  }

  let castedObj = obj.toJSON ? obj.toJSON() : obj;
  castedObj.objectID = castedObj._id ? castedObj._id.toString() : castedObj.id;
  return castedObj;
}

module.exports = function AutoAlgolia(schema, initOptions) {
  if (!initOptions) {
    throw new Error('Init options are required');
  }
  if (!client) {
    throw new Error('Cannot add Algolia methods without proper configuration');
  }

  const autoSave = initOptions.autoSave == null ? true : initOptions.autoSave;

  const includeObjectInIndex = initOptions.includeObjectInIndex || defaultIncludeInIndex;
  const castToObject = initOptions.castToObject || defaultCastToObject;

  const algoliaFunctions = {
    remove: function(index, obj, done) {
      if (!obj) {
        done();
        return;
      }

      const objId = obj._id ? obj._id.toString() : obj.id;

      index.deleteObject(objId, function(err) {
        if (err) {
          logger.warn(err);
        }
        done();
      });
    },

    update: function(index, obj, done) {
      if (!includeObjectInIndex(obj)) {
        done();
        return;
      }

      index.saveObject(castToObject(obj), function(err) {
        if (err) {
          logger.warn(err);
        }
        done();
      });
    }
  };

  const errorsOnNotFound = initOptions.errorsOnNotFound || false;
  const updateIfAnyField = initOptions.updateIfAnyField || null;
  const removeIfFieldSet = initOptions.removeIfFieldSet !== null ? initOptions.removeIfFieldSet : ['removed'];

  const updateFieldsCount = updateIfAnyField ? updateIfAnyField.length : 0;
  const removeFieldsCount = removeIfFieldSet ? removeIfFieldSet.length : 0;

  function determineAndPerform(index, item, shouldRemove, shouldUpdate, next) {
    if (shouldRemove) {
      return algoliaFunctions.remove(index, item, next);
    } else if (shouldUpdate) {
      return algoliaFunctions.update(index, item, next);
    }
  }

  // a custom function that is findOneAndUpdate but also sync's to Algolia
  schema.statics.findOneUpdateAndSync = function findOneUpdateAndSync(query, updater, options, done) {
    if (!done && options instanceof Function) {
      done = options;
      options = {new: true};
    }

    const index = getIndex(this.modelName);
    let shouldRemove = false;
    let shouldUpdate = !updateIfAnyField;

    // doc protection! prevent wiping a document out by forgetting a $set
    for (let prop in updater) {
      if (prop[0] !== '$') {
        if (removeIfFieldSet.indexOf(prop) !== -1) {
          shouldRemove = shouldRemove || !!updater[prop];
          shouldUpdate = shouldUpdate || !updater[prop];
        } else if (removeIfFieldSet.indexOf('!' + prop) !== -1) {
          shouldRemove = shouldRemove || !updater[prop];
          shouldUpdate = shouldUpdate || !!updater[prop];
        }

        if (updateIfAnyField.indexOf(prop) !== -1) {
          shouldUpdate = true;
        }

        updater.$set[prop] = updater[prop];
        delete updater[prop];
      } else if (prop === '$set' || prop === '$inc') {
        const fieldVals = updater[prop];
        for (let p in fieldVals) {
          if (removeIfFieldSet.indexOf(p) !== -1) {
            shouldRemove = shouldRemove || !!fieldVals[p];
            shouldUpdate = shouldUpdate || !fieldVals[p];
          } else if (removeIfFieldSet.indexOf('!' + p) !== -1) {
            shouldRemove = shouldRemove || !!fieldVals[p];
            shouldUpdate = shouldUpdate || !fieldVals[p];
          }
          if (updateIfAnyField.indexOf(p) !== -1) {
            shouldUpdate = true;
          }
        }
      }
    }

    options.new = true;
    this.findOneAndUpdate(query, updater, options, function(err, item) {
      if (err) {
        return done(err);
      }

      if (item) {
        return determineAndPerform(index, item, shouldRemove, shouldUpdate, function() {
          done(null, item);
        });
      } else if (errorsOnNotFound) {
        return done(new NotFoundError('The item was not found.'));
      }

      return done();
    });
  };

  if (autoSave) {
    // hooks to handle auto-updating Algolia
    schema.pre('save', function(next) {
      const item = this;
      const index = getIndex(this.this.constructor.modelName);

      let shouldRemove = false;
      let shouldUpdate = !updateIfAnyField;

      let i = 0;
      for (i = 0; i < removeFieldsCount; i++) {
        const isNegated = removeIfFieldSet[i][0] === '!';
        const fieldName = isNegated ? removeIfFieldSet[i].substring(1) : removeIfFieldSet[i];

        if (item.isModified(fieldName)) {
          const setRemove = isNegated ? !item[fieldName] : !!item[fieldName];

          shouldRemove = shouldRemove || setRemove;
          shouldUpdate = shouldUpdate || !setRemove;
        }
      }
      for (i = 0; i < updateFieldsCount; i++) {
        if (item.isModified(updateIfAnyField[i])) {
          shouldUpdate = true;
          break;
        }
      }

      determineAndPerform(index, item, shouldRemove, shouldUpdate, next);
    });

    schema.pre('remove', function(next) {
      const item = this;
      const index = getIndex(this.this.constructor.modelName);
      algoliaFunctions.remove(index, item, next);
    });
  }

  // instance members to save or remove an object from Algolia
  schema.methods.saveToAlgolia = function() {
    const _this = this;

    return new Promise((resolve, reject) => {
      algoliaFunctions.update(_this, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  schema.methods.removeFromAlgolia = function() {
    const _this = this;

    return new Promise((resolve, reject) => {
      algoliaFunctions.remove(_this, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  // static functions to search or remove an object from Algolia
  schema.statics.removeIdFromAlgolia = function(id) {
    return new Promise((resolve, reject) => {
      algoliaFunctions.remove({id: id}, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  schema.statics.findInAlgolia = function() {
    const index = getIndex(this.modelName);
    return index.apply(index, arguments);
  };

  schema.statics.clearAlgoliaIndex = function() {
    const index = getIndex(this.modelName);
    return index.clearIndex();
  };
};
