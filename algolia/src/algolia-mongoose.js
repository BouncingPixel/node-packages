'use strict';

const algoliasearch = require('algoliasearch');
const nconf = require('nconf');
const logger = require('winston');

const algoliaIndexPrefix = nconf.get('algoliaIndexPrefix');

const client = (nconf.get('algoliaAppId') && nconf.get('algoliaApiKey')) ?
  algoliasearch(nconf.get('algoliaAppId'), nconf.get('algoliaApiKey')) :
  null;

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
  if (!initOptions.indexName) {
    throw new Error('indexName is required in the Init options');
  }
  if (!client) {
    throw new Error('Cannot add Algolia methods without proper configuration');
  }

  const autoSave = initOptions.autoSave == null ? true : initOptions.autoSave;

  const includeObjectInIndex = initOptions.includeObjectInIndex || defaultIncludeInIndex;
  const castToObject = initOptions.castToObject || defaultCastToObject;

  const index = client.initIndex(algoliaIndexPrefix + '_' + initOptions.indexName);

  const algoliaFunctions = {
    remove: function(obj, done) {
      if (!obj) {
        done();
        return;
      }

      const objId = obj._id ? obj._id.toString() : obj.id;

      index.deleteObject(objId, function(err) {
        logger.warn(err);
        done();
      });
    },

    update: function(obj, done) {
      if (!includeObjectInIndex(obj)) {
        done();
        return;
      }

      index.saveObject(castToObject(obj), function(err) {
        logger.warn(err);
        done();
      });
    }
  };

  const errorsOnNotFound = initOptions.errorsOnNotFound || false;
  const updateIfAnyField = initOptions.updateIfAnyField || null;
  const removeIfFieldSet = initOptions.removeIfFieldSet !== null ? initOptions.removeIfFieldSet : ['removed'];

  const updateFieldsCount = updateIfAnyField ? updateIfAnyField.length : 0;
  const removeFieldsCount = removeIfFieldSet ? removeIfFieldSet.length : 0;

  function determineAndPerform(item, shouldRemove, shouldUpdate, next) {
    if (shouldRemove) {
      return algoliaFunctions.remove(item, next);
    } else if (shouldUpdate) {
      return algoliaFunctions.update(item, next);
    }
  }

  // a custom function that is findOneAndUpdate but also sync's to Algolia
  schema.statics.findOneUpdateAndSync = function findOneUpdateAndSync(query, updater, options, done) {
    if (!done && options instanceof Function) {
      done = options;
      options = {new: true};
    }

    let shouldRemove = false;
    let shouldUpdate = !updateIfAnyField;

    // doc protection! prevent wiping a document out by forgetting a $set
    for (let prop in updater) {
      if (prop[0] !== '$') {
        if (removeIfFieldSet.indexOf(prop) !== -1) {
          shouldRemove = shouldRemove || updater[prop];
          shouldUpdate = shouldUpdate || !updater[prop];
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
            shouldRemove = shouldRemove || fieldVals[p];
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
        return determineAndPerform(item, shouldRemove, shouldUpdate, function() {
          done(null, item);
        });
      } else if (errorsOnNotFound) {
        return done(ServerErrors.NotFound('The item was not found.'));
      }

      return done();
    });
  };

  if (autoSave) {
    // hooks to handle auto-updating Algolia
    schema.pre('save', function(next) {
      const item = this;

      let shouldRemove = false;
      let shouldUpdate = !updateIfAnyField;

      let i = 0;
      for (i = 0; i < removeFieldsCount; i++) {
        if (item.isModified(removeIfFieldSet[i])) {
          shouldRemove = shouldRemove || item[removeIfFieldSet[i]];
          // even if one field states to remove, this is ok
          shouldUpdate = shouldUpdate || !item[removeIfFieldSet[i]];
        }
      }
      for (i = 0; i < updateFieldsCount; i++) {
        if (item.isModified(updateIfAnyField[i])) {
          shouldUpdate = true;
          break;
        }
      }

      determineAndPerform(item, shouldRemove, shouldUpdate, next);
    });

    schema.pre('remove', function(next) {
      const item = this;
      algoliaFunctions.remove(item, next);
    });
  }

  // instance members to save or remove an object from Algolia
  schema.methods.saveToAlgolia = function(done) {
    algoliaFunctions.update(this, done);
  };

  schema.methods.removeFromAlgolia = function(done) {
    algoliaFunctions.remove(this, done);
  };

  // static functions to search or remove an object from Algolia
  schema.statics.removeIdFromAlgolia = function(id, done) {
    algoliaFunctions.remove({id: id}, done);
  };

  schema.statics.findInAlgolia = function() {
    return index.apply(index, arguments);
  };

  schema.statics.clearAlgoliaIndex = function(done) {
    return index.clearIndex(done);
  };
};
