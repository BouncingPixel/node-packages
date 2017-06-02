const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

mongoose.Promise = bluebird;
const mockgoose = new Mockgoose(mongoose);

const plugin = require('..');

describe('Mongoose ACL Tests - ', function() {
  const AllowAllSchema = mongoose.Schema({one: String, two: String});
  const allowAllSettings = {
    canDelete: jasmine.createSpy('canDeleteAllow').and.returnValue(true)
  };
  let AllowAllModel = null;

  const DenyAllSchema = mongoose.Schema({one: String, two: String});
  const denyAllSettings = {
    canDelete: jasmine.createSpy('canDeleteDeny').and.returnValue(false)
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
    AllowAllModel = mongoose.model('allowAllDelete', AllowAllSchema, 'testcollection');

    DenyAllSchema.plugin(plugin, denyAllSettings);
    DenyAllModel = mongoose.model('denyAllDelete', DenyAllSchema, 'testcollection');

    AllowDefaultSchema.plugin(plugin, allowDefaultSettings);
    AllowDefaultModel = mongoose.model('allowDefaultDelete', AllowDefaultSchema, 'testcollection');

    DenyDefaultSchema.plugin(plugin, denyDefaultSettings);
    DenyDefaultModel = mongoose.model('denyDefaultDelete', DenyDefaultSchema, 'testcollection');

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

  describe('Delete', function() {
    it('should do allow when canDelete returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          return newItem.remove();
        })
        .then(function() {
          expect(allowAllSettings.canDelete).toHaveBeenCalled();
          expect(allowAllSettings.canDelete).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should block when canDelete returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          return newItem.remove();
        })
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canDelete).toHaveBeenCalled();
          expect(denyAllSettings.canDelete).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should default to allow when canDelete is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          return newItem.remove();
        })
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block when canDelete is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          return newItem.remove();
        })
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      const newItem = new UnsafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          return newItem.remove();
        })
        .then(function() {
          expect(denyAllSettings.canDelete).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      const newItem = AllowAllModel.hydrate({
        _id: '54108337212ffb6d459f854c',
        one: 'value',
        two: 'value'
      });

      newItem
        .remove()
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canDelete).not.toHaveBeenCalled();
          done();
        });
    });
  });

});
