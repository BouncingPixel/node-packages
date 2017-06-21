'use strict';

// const nconf = require('nconf');
// const logger = require('winston');
const ObjectId = require('mongoose').Types.ObjectId;

const HttpErrors = require('@bouncingpixel/http-errors');

module.exports = function MongooseAcl(schema, initOptions) {
  if (!initOptions) {
    throw new Error('Init options are required with canCreate, canEdit, canRead, and/or canRemove');
  }

  const canCreate = getCanFunction(initOptions, 'canCreate');
  const canRead = getCanFunction(initOptions, 'canRead');
  const canUpdate = getCanFunction(initOptions, 'canUpdate');
  const canDelete = getCanFunction(initOptions, 'canDelete');
  // note, canDelete is special in that it is JUST a true/false kind of thing

  // hooks to perform actions, but does rely on a .protect'd model to have .$req
  // otherwise, the hooks just bypass themselves

  // using validate instead of save, because this catches before updated/created are changed by a pre-save
  // because maybe admins can edit a createdAt, but users cannot
  schema.pre('validate', function(next) {
    // if its not been .protect'd, then ignore this hook
    if (this.constructor.$unsafeAcl) {
      next();
      return;
    }

    if (!this.constructor.$req) {
      next(new Error('Call .protect to get a protected Model'));
      return;
    }

    const req = this.constructor.$req;

    const accessFn = this.isNew ? canCreate : canUpdate;

    Promise
      .resolve(accessFn.call(this.constructor, req, this))
      .then((access) => {
        // false means no access at all (null and undefined also are caught like this too)
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        // true means full access
        if (access === true) {
          next();
          return;
        }

        // otherwise, we need to check the paths
        if (validateAllowedPaths(this.constructor, this, access)) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        next();
      })
      .catch(next);
  });

  schema.pre('remove', function(next) {
    if (this.constructor.$unsafeAcl) {
      next();
      return;
    }

    if (!this.constructor.$req) {
      next(new Error('Call .protect to get a protected Model'));
      return;
    }

    const req = this.constructor.$req;

    Promise
      .resolve(canDelete.call(this.constructor, req, this))
      .then((access) => {
        // false means no access at all (null and undefined also are caught like this too)
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        // since it is either true or false, then it must be true, so we allow the delete
        next();
      })
      .catch(next);
  });

  // query hooks just manipulate the queries
  schema.pre('count', function(next) {
    // count only modifies the query if its there
    if (this.model.$unsafeAcl) {
      next();
      return;
    }

    if (!this.model.$req) {
      next(new Error('Call .protect to get a protected Model'));
      return;
    }

    const req = this.model.$req;

    Promise
      .resolve(canRead.call(this.model, req, this.getQuery()))
      .then((access) => {
        // false means no access at all (null and undefined also are caught like this too)
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        // we expose the query for custom where or limits
        if (access.query) {
          access.query(this);
        }

        next();
      })
      .catch(next);
  });
  function findMiddleware(next) {
    if (this.model.$unsafeAcl) {
      next();
      return;
    }

    if (!this.model.$req) {
      next(new Error('Call .protect to get a protected Model'));
      return;
    }

    const req = this.model.$req;

    Promise
      .resolve(canRead.call(this.model, req, this.getQuery()))
      .then((access) => {
        // false means no access at all (null and undefined also are caught like this too)
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        if (access === true) {
          next();
          return;
        }

        const allowedPaths = getAllowedPaths(this.model, access) || [];

        // we expose the query for custom where or limits
        if (access.query) {
          access.query(this);
        }

        if (allowedPaths.length) {
          const select = {};
          allowedPaths.forEach(path => select[path] = 1);

          this.select(select);
        } else {
          this.select({_id: 1});
        }

        next();
      })
      .catch(next);
  }
  schema.pre('find', findMiddleware);
  schema.pre('findOne', findMiddleware);

  schema.pre('findOneAndRemove', function(next) {
    const _this = this;
    // verify we can do the find first
    findMiddleware.call(_this, function() {
      const req = _this.model.$req;

      // we need the record first, unfortunately
      // this is just what happens when you want security.
      // don't want a second query (cause you are using findOneAndUpdate)? then use the unprotected model.
      _this.model.findOne(_this.getQuery()).then(function(item) {
        // then validate the update
        return canDelete.call(_this.model, req, item);
      }).then((access) => {
        // can remove is simply a true/false thing
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        next();
      }).catch(next);
    });
  });

  // findOneAndUpdate (this is special since it requires checking if we can update it first)
  schema.pre('findOneAndUpdate', function(next) {
    const _this = this;
    // verify we can do the find first
    findMiddleware.call(_this, function() {
      const req = _this.model.$req;

      // we need the record first, unfortunately
      // this is just what happens when you want security.
      // don't want a second query (cause you are using findOneAndUpdate)? then use the unprotected model.
      _this.model.findOne(_this.getQuery()).then(function(item) {
        // then validate the update
        return canUpdate.call(_this.model, req, item);
      }).then((access) => {
        // false means no access at all (null and undefined also are caught like this too)
        if (!access) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        // true means full access
        if (access === true) {
          next();
          return;
        }

        // otherwise, we need to check the paths
        if (validateAllowedPaths(_this.model, _this.getUpdate(), access)) {
          // TODO: customize the error message
          next(new HttpErrors.ForbiddenError('Do not have access'));
          return;
        }

        next();
      }).catch(next);
    });
  });

  // update
  schema.pre('update', function(next) {
    if (this.model.$unsafeAcl) {
      next();
      return;
    }

    if (!this.model.$req) {
      next(new Error('Call .protect to get a protected Model'));
      return;
    }

    const req = this.model.$req;
    const _this = this;

    _this.model.findOne(_this.getQuery()).then(function(item) {
      return canUpdate.call(_this.model, req, item);
    }).then((access) => {
      // false means no access at all (null and undefined also are caught like this too)
      if (!access) {
        // TODO: customize the error message
        next(new HttpErrors.ForbiddenError('Do not have access'));
        return;
      }

      // true means full access
      if (access === true) {
        next();
        return;
      }

      // otherwise, we need to check the paths
      if (validateAllowedPaths(_this.model, _this.getUpdate(), access)) {
        // TODO: customize the error message
        next(new HttpErrors.ForbiddenError('Do not have access'));
        return;
      }

      next();
    }).catch(next);
  });

  // TODO: insertMany query middleware

  schema.statics.protect = function(req, _res, next) {
    if (!req.protectedModels) {
      req.protectedModels = {};
    }
    if (!req.protectedModels[this.modelName]) {
      req.protectedModels[this.modelName] = makeProtectedModel(this, req);
    }

    if (next) {
      next();
      return;
    }

    return req.protectedModels[this.modelName];
  };

  schema.statics.unsafeModel = function() {
    return makeUnsafeModel(this);
  };

  function makeProtectedModel(model, req) {
    function modelClone(...args) {
      model.apply(this, args);
    }
    modelClone.$req = req;
    Object.assign(modelClone, model);

    modelClone.prototype = Object.create(model.prototype, {constructor: {value: modelClone}});
    modelClone.__proto__ = model.__proto__;

    return modelClone;
  }

  function makeUnsafeModel(model) {
    function modelClone(...args) {
      model.apply(this, args);
    }
    modelClone.$unsafeAcl = true;
    Object.assign(modelClone, model);

    modelClone.prototype = Object.create(model.prototype, {constructor: {value: modelClone}});
    modelClone.__proto__ = model.__proto__;

    return modelClone;
  }

  // middleware builders
  schema.statics.makeCreate = function(options) {
    options = options || {};

    const resLocalsField = options.dataField || 'data';
    const incomingDataField = options.incomingDataField || this.modelName;

    const UnsafeModel = this;

    return function createMiddleware(req, res, next) {
      // get protected model instance
      const SafeModel = UnsafeModel.protect(req);

      let promise = null;

      // check if there is a deserializeForm available to use and run it
      if (SafeModel.deserializeForm instanceof Function) {
        promise = Promise.resolve(SafeModel.deserializeForm());
      } else {
        promise = Promise.resolve();
      }

      promise.then(function() {
        // do a new, set values
        const inst = new SafeModel(req.body[incomingDataField]);

        // save
        return inst.save().then(function(savedInstance) {
          // set a res.locals field to the saved instance
          res.locals[resLocalsField] = savedInstance;
          next();
        });
      }).catch(next);
    };
  };

  function makeReadQueryFactory(readFn) {
    return function(options) {
      options = options || {};

      const initialWhere = options.initialWhere;
      const initialSort = options.initialSort;
      const initialLimit = options.initialLimit;
      const initialOffset = options.initialOffset;

      const canExtendWhere = defaultUndefined(options.canExtendWhere, false);
      const canExtendSort = defaultUndefined(options.canExtendSort, false);
      const canSetLimit = defaultUndefined(options.canSetLimit, false);
      const canSetOffset = defaultUndefined(options.canSetOffset, false);

      const resLocalsField = options.dataField || 'data';
      const UnsafeModel = this;

      return function readMiddleware(req, res, next) {
        // get protected model instance
        const SafeModel = UnsafeModel.protect(req);

        // get the query, sort, limit, offset
        let query = SafeModel[readFn]();

        // TODO: how can we make this safe?
        // TODO: also, how do we validate it is a valid where clause?
        if (canExtendWhere && req.query.where) {
          query = query.where(req.query.where);
        }
        // initial is always last, so that our settings overrides theirs
        if (initialWhere) {
          query = query.where(initialWhere);
        }

        if (canExtendSort && req.query.sort) {
          query = query.sort(req.query.sort);
        }
        if (initialSort) {
          query = query.sort(initialSort);
        }

        if (canSetLimit && req.query.limit) {
          query = query.limit(req.query.limit);
        } else if (initialLimit) {
          query = query.limit(initialLimit);
        }

        if (canSetOffset && req.query.offset) {
          query = query.skip(req.query.offset);
        } else if (initialOffset) {
          query = query.skip(initialOffset);
        }

        if (req.params.id) {
          query = query.where({_id: req.params.id});
        }

        // run the fetch
        query.exec().then(function(data) {
          if (data == null) {
            throw new HttpErrors.NotFoundError('Could not find the item');
          }

          // set a res.locals field to the fetched data
          res.locals[resLocalsField] = data;
          next();
        }).catch(next);
      };
    };
  }

  schema.statics.makeReadMany = makeReadQueryFactory('find');
  schema.statics.makeReadOne = makeReadQueryFactory('findOne');

  schema.statics.makeUpdate = function(options) {
    options = options || {};

    const mergeUpdates = options.mergeUpdates || defaultMergeUpdates;
    const resLocalsField = options.dataField || 'data';
    const incomingDataField = options.incomingDataField || this.modelName;

    const UnsafeModel = this;

    return function updateMiddleware(req, res, next) {
      // get protected model instance
      const SafeModel = UnsafeModel.protect(req);

      const id = req.params.id;
      if (!id || !ObjectId.isValid(id)) {
        // TODO: need more of that custom error magic
        throw new HttpErrors.BadRequestError('Must specify which item to update');
      }

      SafeModel.findOne({_id: id}).then(function(item) {
        if (!item) {
          // TODO: need more of that custom error magic
          throw new HttpErrors.NotFoundError('Could not find the item to delete');
        }

        let promise = null;

        // check if there is a deserializeForm available to use and run it
        if (SafeModel.deserializeForm instanceof Function) {
          promise = Promise.resolve(SafeModel.deserializeForm(item));
        } else {
          promise = Promise.resolve();
        }

        return promise.then(function() {
          const newItemData = req.body[incomingDataField];

          return mergeUpdates(item, newItemData, req);
        }).then(function() {
          return item.save();
        });
      }).then(function(savedInstance) {
        // set a res.locals field to the saved instance
        res.locals[resLocalsField] = savedInstance;
        next();
      }).catch(next);
    };
  };

  schema.statics.makeDelete = function(options) {
    options = options || {};

    const resLocalsField = options.dataField || 'data';
    const UnsafeModel = this;

    return function deleteMiddleware(req, res, next) {
      // get protected model instance
      const SafeModel = UnsafeModel.protect(req);

      const id = req.params.id;
      if (!id || !ObjectId.isValid(id)) {
        // TODO: need more of that custom error magic
        throw new HttpErrors.BadRequestError('Must specify which item to delete');
      }

      SafeModel
        .findOne({_id: id})
        .select({_id: 1})
        .then(function(item) {
          if (!item) {
            // TODO: need more of that custom error magic
            throw new HttpErrors.NotFoundError('Could not find the item to delete');
          }

          return item.remove().then(function() {
            // set a res.locals field to the removed instance
            res.locals[resLocalsField] = item;
            next();
          });
        }).catch(next);
    };
  };

  schema.statics.expressRoutes = function() {
    // PUT/POST /:id -> update
    // POST / -> create
    // DELETE /:id or /delete/:id -> delete
    // GET / -> read list
    // GET /:id -> read single

    // return a router with the above set
    const router = require('express').Router();
    if (canRead !== defaultClosed) {
      router.get('/', this.makeReadMany());
      router.get('/:id', this.makeReadOne());
    }

    if (canCreate !== defaultClosed) {
      router.post('/', this.makeCreate());
    }

    if (canUpdate !== defaultClosed) {
      router.post('/:id', this.makeUpdate());
      router.put('/:id', this.makeUpdate());
    }

    if (canDelete !== defaultClosed) {
      router.delete('/:id', this.makeDelete());
      router.post('/delete/:id', this.makeDelete());
    }

    return router;
  };
};

function defaultOpen() {
  return true;
}
function defaultClosed() {
  return false;
}

function defaultUndefined(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  return value;
}

// returns the can___ function or a default
// if the key is undefined, returns defaultOpen
// if the key is false/null, returns defaultClosed
function getCanFunction(options, canKey) {
  if (options && options.hasOwnProperty(canKey)) {
    return options[canKey] || defaultClosed;
  }

  return defaultOpen;
}

function getAccessPaths(model, access) {
  const allPaths = Object.keys(model.schema.paths);
  let allowedPaths = null;

  if (Array.isArray(access)) {
    allowedPaths = access;
  } else if (access.allow && Array.isArray(access.allow)) {
    allowedPaths = access.allow;
  } else {
    allowedPaths = allPaths;
  }

  if (access.disallow && Array.isArray(access.disallow)) {
    allowedPaths = allowedPaths.filter(p => access.disallow.indexOf(p) === -1);
  }

  return [allPaths, allowedPaths];
}

function getAllowedPaths(model, access) {
  return getAccessPaths(model, access)[1];
}

function validateAllowedPaths(model, doc, access) {
  const [allPaths, allowedPaths] = getAccessPaths(model, access);

  const fields = [
    '$inc',
    '$mul',
    '$rename',
    '$setOnInsert',
    '$set',
    '$unset',
    '$min',
    '$max',
    '$currentDate'
  ];

  const hasFields = fields.filter(field => doc[field] != null);

  if (hasFields.length) {
    // then we check them all
    return hasFields.some(field => {
      const data = doc[field];
      return !data || allPaths.some(path => data.hasOwnProperty(path) && allowedPaths.indexOf(path) === -1);
    });
  }

  return allPaths.some(path => doc.isModified(path) && allowedPaths.indexOf(path) === -1);
}

function defaultMergeUpdates(doc, newItemData, _req) {
  for (const prop in newItemData) {
    doc[prop] = newItemData[prop];
  }
}
