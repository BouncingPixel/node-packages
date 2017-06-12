const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

mongoose.Promise = bluebird;
const mockgoose = new Mockgoose(mongoose);

const plugin = require('..');

describe('Mongoose ACL Tests - ', function() {
  const AllowAllSchema = mongoose.Schema({one: String, two: String});
  const allowAllSettings = {
    canCreate: jasmine.createSpy('canCreateAllow').and.returnValue(true)
  };
  let AllowAllModel = null;

  const AllowSomeSchema = mongoose.Schema({one: String, two: String});
  const allowSomeSettings = {
    canCreate: jasmine.createSpy('canCreateSome').and.returnValue(['one'])
  };
  let AllowSomeModel = null;

  const AllowSome2Schema = mongoose.Schema({one: String, two: String});
  const allowSome2Settings = {
    canCreate: jasmine.createSpy('canCreateSome2').and.returnValue({allow: ['one']})
  };
  let AllowSome2Model = null;

  const AllowNoneSchema = mongoose.Schema({one: String, two: String});
  const allowNoneSettings = {
    canCreate: jasmine.createSpy('canCreateNone').and.returnValue([])
  };
  let AllowNoneModel = null;

  const DisallowSomeSchema = mongoose.Schema({one: String, two: String});
  const disallowSomeSettings = {
    canCreate: jasmine.createSpy('canCreateNotAll').and.returnValue({disallow: ['one']})
  };
  let DisallowSomeModel = null;

  const DenyAllSchema = mongoose.Schema({one: String, two: String});
  const denyAllSettings = {
    canCreate: jasmine.createSpy('canCreateDeny').and.returnValue(false)
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
    AllowAllModel = mongoose.model('allowAllCreate', AllowAllSchema, 'testcollection');

    AllowSomeSchema.plugin(plugin, allowSomeSettings);
    AllowSomeModel = mongoose.model('allowSomeCreate', AllowSomeSchema, 'testcollection');

    AllowSome2Schema.plugin(plugin, allowSome2Settings);
    AllowSome2Model = mongoose.model('allowSomeTwoCreate', AllowSome2Schema, 'testcollection');

    AllowNoneSchema.plugin(plugin, allowNoneSettings);
    AllowNoneModel = mongoose.model('allowNoneCreate', AllowNoneSchema, 'testcollection');

    DisallowSomeSchema.plugin(plugin, disallowSomeSettings);
    DisallowSomeModel = mongoose.model('disallowSomeCreate', DisallowSomeSchema, 'testcollection');

    DenyAllSchema.plugin(plugin, denyAllSettings);
    DenyAllModel = mongoose.model('denyAllCreate', DenyAllSchema, 'testcollection');

    AllowDefaultSchema.plugin(plugin, allowDefaultSettings);
    AllowDefaultModel = mongoose.model('allowDefaultCreate', AllowDefaultSchema, 'testcollection');

    DenyDefaultSchema.plugin(plugin, denyDefaultSettings);
    DenyDefaultModel = mongoose.model('denyDefaultCreate', DenyDefaultSchema, 'testcollection');

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

  describe('Create', function() {
    it('should do allow create when canCreate returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          expect(allowAllSettings.canCreate).toHaveBeenCalled();
          expect(allowAllSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields create when canCreate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value'
      });

      newItem
        .save()
        .then(function() {
          expect(allowSomeSettings.canCreate).toHaveBeenCalled();
          expect(allowSomeSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields create when canCreate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value'
      });

      newItem
        .save()
        .then(function() {
          expect(allowSome2Settings.canCreate).toHaveBeenCalled();
          expect(allowSome2Settings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow no-fields create when canCreate returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const newItem = new SafeModel({});

      newItem
        .save()
        .then(function() {
          expect(allowNoneSettings.canCreate).toHaveBeenCalled();
          expect(allowNoneSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow disallow-some-fields create when canCreate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          expect(disallowSomeSettings.canCreate).toHaveBeenCalled();
          expect(disallowSomeSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do deny some-fields create when canCreate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSomeSettings.canCreate).toHaveBeenCalled();
          expect(allowSomeSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny some-fields create when canCreate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const newItem = new SafeModel({
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSome2Settings.canCreate).toHaveBeenCalled();
          expect(allowSome2Settings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny no-fields create when canCreate returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value'
      });

      newItem
        .save()
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowNoneSettings.canCreate).toHaveBeenCalled();
          expect(allowNoneSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny disallow-some-fields create when canCreate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value'
      });

      newItem
        .save()
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(disallowSomeSettings.canCreate).toHaveBeenCalled();
          expect(disallowSomeSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should block create when canCreate returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const newItem = new SafeModel({});
      newItem
        .save()
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canCreate).toHaveBeenCalled();
          expect(denyAllSettings.canCreate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should default to allow create when canCreate is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block create when canCreate is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({});

      newItem
        .save()
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow create for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      const newItem = new UnsafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          expect(denyAllSettings.canCreate).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      const newItem = new AllowAllModel({});

      newItem
        .save()
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canCreate).not.toHaveBeenCalled();
          done();
        });
    });
  });

});
