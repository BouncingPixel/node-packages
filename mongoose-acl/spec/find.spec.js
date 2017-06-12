const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

mongoose.Promise = bluebird;
const mockgoose = new Mockgoose(mongoose);

const plugin = require('..');

describe('Mongoose ACL Tests - ', function() {
  const AllowAllSchema = mongoose.Schema({one: String, two: String});
  const allowAllSettings = {
    canRead: jasmine.createSpy('canReadAllow').and.returnValue(true)
  };
  let AllowAllModel = null;

  const AllowSomeSchema = mongoose.Schema({one: String, two: String});
  const allowSomeSettings = {
    canRead: jasmine.createSpy('canReadSome').and.returnValue(['one'])
  };
  let AllowSomeModel = null;

  const AllowSome2Schema = mongoose.Schema({one: String, two: String});
  const allowSome2Settings = {
    canRead: jasmine.createSpy('canReadSome2').and.returnValue({allow: ['one']})
  };
  let AllowSome2Model = null;

  const AllowNoneSchema = mongoose.Schema({one: String, two: String});
  const allowNoneSettings = {
    canRead: jasmine.createSpy('canReadNone').and.returnValue([])
  };
  let AllowNoneModel = null;

  const AllowReadQuerySchema = mongoose.Schema({one: String, two: String});
  const canReadQueryFn = jasmine.createSpy('canReadQueryFn').and.callFake(function(q) {
    q.where({one: 'value'});
  });
  const allowReadQuerySettings = {
    canRead: jasmine.createSpy('canReadQuery').and.returnValue({
      query: canReadQueryFn
    })
  };
  let AllowReadQueryModel = null;

  const DisallowSomeSchema = mongoose.Schema({one: String, two: String});
  const disallowSomeSettings = {
    canRead: jasmine.createSpy('canReadNotAll').and.returnValue({disallow: ['one']})
  };
  let DisallowSomeModel = null;

  const DenyAllSchema = mongoose.Schema({one: String, two: String});
  const denyAllSettings = {
    canRead: jasmine.createSpy('canReadDeny').and.returnValue(false)
  };
  let DenyAllModel = null;

  const AllowDefaultSchema = mongoose.Schema({one: String, two: String});
  const allowDefaultSettings = {};
  let AllowDefaultModel = null;

  const DenyDefaultSchema = mongoose.Schema({one: String, two: String});
  const denyDefaultSettings = {
    canRead: false,
    canUpdate: false,
    canCreate: false,
    canDelete: false
  };
  let DenyDefaultModel = null;

  beforeAll(function(done) {
    AllowAllSchema.plugin(plugin, allowAllSettings);
    AllowAllModel = mongoose.model('allowAllRead', AllowAllSchema, 'testcollection');

    AllowSomeSchema.plugin(plugin, allowSomeSettings);
    AllowSomeModel = mongoose.model('allowSomeRead', AllowSomeSchema, 'testcollection');

    AllowSome2Schema.plugin(plugin, allowSome2Settings);
    AllowSome2Model = mongoose.model('allowSomeTwoRead', AllowSome2Schema, 'testcollection');

    AllowNoneSchema.plugin(plugin, allowNoneSettings);
    AllowNoneModel = mongoose.model('allowNoneRead', AllowNoneSchema, 'testcollection');

    AllowReadQuerySchema.plugin(plugin, allowReadQuerySettings);
    AllowReadQueryModel = mongoose.model('allowQueryRead', AllowReadQuerySchema, 'testcollection');

    DisallowSomeSchema.plugin(plugin, disallowSomeSettings);
    DisallowSomeModel = mongoose.model('disallowSomeRead', DisallowSomeSchema, 'testcollection');

    DenyAllSchema.plugin(plugin, denyAllSettings);
    DenyAllModel = mongoose.model('denyAllRead', DenyAllSchema, 'testcollection');

    AllowDefaultSchema.plugin(plugin, allowDefaultSettings);
    AllowDefaultModel = mongoose.model('allowDefaultRead', AllowDefaultSchema, 'testcollection');

    DenyDefaultSchema.plugin(plugin, denyDefaultSettings);
    DenyDefaultModel = mongoose.model('denyDefaultRead', DenyDefaultSchema, 'testcollection');

    if (mongoose.connection.readyState) {
      done();
      return;
    }

    mockgoose.prepareStorage().then(function() {
      mongoose.connect('mongodb://localhost/test-db', function(err) {
        done(err);
      });
    });
  });

  beforeEach(function(done) {
    for (let p in allowAllSettings) {
      allowAllSettings[p].calls.reset();
      allowSomeSettings[p].calls.reset();
      allowSome2Settings[p].calls.reset();
      allowNoneSettings[p].calls.reset();
      disallowSomeSettings[p].calls.reset();
      denyAllSettings[p].calls.reset();
    }
    allowReadQuerySettings.canRead.calls.reset();
    canReadQueryFn.calls.reset();

    done();
  });

  afterEach(function(done) {
    // clear all models out after each run
    AllowAllModel
      .remove({})
      .then(function() {
        done();
      }).catch(done);
  });

  describe('Find', function() {
    it('should do allow find when canRead returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .find(query)
        .then(function() {
          expect(allowAllSettings.canRead).toHaveBeenCalled();
          expect(allowAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields find when canRead returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.find(query);

      mongooseQuery
        .then(function() {
          expect(allowSomeSettings.canRead).toHaveBeenCalled();
          expect(allowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({one: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields find when canRead returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.find(query);

      mongooseQuery
        .then(function() {
          expect(allowSome2Settings.canRead).toHaveBeenCalled();
          expect(allowSome2Settings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({one: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow no-fields find when canRead returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.find(query);

      mongooseQuery
        .then(function() {
          expect(allowNoneSettings.canRead).toHaveBeenCalled();
          expect(allowNoneSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({_id: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should call query modifier for find when canRead specifies one', function(done) {
      const mockRequest = {};
      const SafeModel = AllowReadQueryModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.find(query);

      mongooseQuery
        .then(function() {
          expect(allowReadQuerySettings.canRead).toHaveBeenCalled();
          expect(allowReadQuerySettings.canRead).toHaveBeenCalledWith(
            mockRequest,
            jasmine.objectContaining({one: 'value'})
          );

          expect(canReadQueryFn).toHaveBeenCalled();
          expect(canReadQueryFn).toHaveBeenCalledWith(mongooseQuery);

          expect(mongooseQuery.getQuery()).toEqual({one: 'value'});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow disallow-some-fields find when canRead returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.find(query);

      mongooseQuery
        .then(function() {
          expect(disallowSomeSettings.canRead).toHaveBeenCalled();
          expect(disallowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({
            two: 1,
            _id: 1,
            __v: 1
          });
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should block find when canRead returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .find(query)
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canRead).toHaveBeenCalled();
          expect(denyAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        });
    });

    it('should default to allow find when canRead is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      SafeModel
        .find({})
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block find when canRead is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      SafeModel
        .find({})
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow find for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      UnsafeModel
        .find({})
        .then(function() {
          expect(denyAllSettings.canRead).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      AllowAllModel
        .find({})
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canRead).not.toHaveBeenCalled();
          done();
        });
    });
  });


  describe('FindOne', function() {
    it('should do allow findOne when canRead returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .findOne(query)
        .then(function() {
          expect(allowAllSettings.canRead).toHaveBeenCalled();
          expect(allowAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields findOne when canRead returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.findOne(query);

      mongooseQuery
        .then(function() {
          expect(allowSomeSettings.canRead).toHaveBeenCalled();
          expect(allowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({one: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields findOne when canRead returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.findOne(query);

      mongooseQuery
        .then(function() {
          expect(allowSome2Settings.canRead).toHaveBeenCalled();
          expect(allowSome2Settings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({one: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow no-fields findOne when canRead returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.findOne(query);

      mongooseQuery
        .then(function() {
          expect(allowNoneSettings.canRead).toHaveBeenCalled();
          expect(allowNoneSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({_id: 1});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should call query modifier for findOne when canRead specifies one', function(done) {
      const mockRequest = {};
      const SafeModel = AllowReadQueryModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.findOne(query);

      mongooseQuery
        .then(function() {
          expect(allowReadQuerySettings.canRead).toHaveBeenCalled();
          expect(allowReadQuerySettings.canRead).toHaveBeenCalledWith(
            mockRequest,
            jasmine.objectContaining({one: 'value'})
          );

          expect(canReadQueryFn).toHaveBeenCalled();
          expect(canReadQueryFn).toHaveBeenCalledWith(mongooseQuery);

          expect(mongooseQuery.getQuery()).toEqual({one: 'value'});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow disallow-some-fields findOne when canRead returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.findOne(query);

      mongooseQuery
        .then(function() {
          expect(disallowSomeSettings.canRead).toHaveBeenCalled();
          expect(disallowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery._fieldsForExec()).toEqual({
            two: 1,
            _id: 1,
            __v: 1
          });
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should block findOne when canRead returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .findOne(query)
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canRead).toHaveBeenCalled();
          expect(denyAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        });
    });

    it('should default to allow findOne when canRead is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      SafeModel
        .findOne({})
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block findOne when canRead is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      SafeModel
        .findOne({})
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow findOne for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      UnsafeModel
        .findOne({})
        .then(function() {
          expect(denyAllSettings.canRead).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      AllowAllModel
        .findOne({})
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canRead).not.toHaveBeenCalled();
          done();
        });
    });
  });

  describe('Count', function() {
    it('should do allow when canRead returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .count(query)
        .then(function() {
          expect(allowAllSettings.canRead).toHaveBeenCalled();
          expect(allowAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow when canRead returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.count(query);

      mongooseQuery
        .then(function() {
          expect(allowSomeSettings.canRead).toHaveBeenCalled();
          expect(allowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery.selected()).toBe(false);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow when canRead returns object.allow', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.count(query);

      mongooseQuery
        .then(function() {
          expect(allowSome2Settings.canRead).toHaveBeenCalled();
          expect(allowSome2Settings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery.selected()).toBe(false);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow when canRead returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.count(query);

      mongooseQuery
        .then(function() {
          expect(allowNoneSettings.canRead).toHaveBeenCalled();
          expect(allowNoneSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery.selected()).toBe(false);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should call query modifier when canRead specifies one', function(done) {
      const mockRequest = {};
      const SafeModel = AllowReadQueryModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.count(query);

      mongooseQuery
        .then(function() {
          expect(allowReadQuerySettings.canRead).toHaveBeenCalled();
          expect(allowReadQuerySettings.canRead).toHaveBeenCalledWith(
            mockRequest,
            jasmine.objectContaining({one: 'value'})
          );

          expect(canReadQueryFn).toHaveBeenCalled();
          expect(canReadQueryFn).toHaveBeenCalledWith(mongooseQuery);

          expect(mongooseQuery.getQuery()).toEqual({one: 'value'});
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow when canRead returns object.disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const query = {};
      const mongooseQuery = SafeModel.count(query);

      mongooseQuery
        .then(function() {
          expect(disallowSomeSettings.canRead).toHaveBeenCalled();
          expect(disallowSomeSettings.canRead).toHaveBeenCalledWith(mockRequest, query);

          expect(mongooseQuery.selected()).toBe(false);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should block when canRead returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const query = {};
      SafeModel
        .count(query)
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canRead).toHaveBeenCalled();
          expect(denyAllSettings.canRead).toHaveBeenCalledWith(mockRequest, query);
          done();
        });
    });

    it('should default to allow when canRead is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      SafeModel
        .count({})
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block when canRead is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      SafeModel
        .count({})
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      UnsafeModel
        .count({})
        .then(function() {
          expect(denyAllSettings.canRead).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      AllowAllModel
        .count({})
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canRead).not.toHaveBeenCalled();
          done();
        });
    });
  });

});
