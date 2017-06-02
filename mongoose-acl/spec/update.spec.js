const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

mongoose.Promise = bluebird;
const mockgoose = new Mockgoose(mongoose);

const plugin = require('..');

describe('Mongoose ACL Tests - ', function() {
  const AllowAllSchema = mongoose.Schema({one: String, two: String});
  const allowAllSettings = {
    canUpdate: jasmine.createSpy('canUpdateAllow').and.returnValue(true)
  };
  let AllowAllModel = null;

  const AllowSomeSchema = mongoose.Schema({one: String, two: String});
  const allowSomeSettings = {
    canUpdate: jasmine.createSpy('canUpdateSome').and.returnValue(['one'])
  };
  let AllowSomeModel = null;

  const AllowSome2Schema = mongoose.Schema({one: String, two: String});
  const allowSome2Settings = {
    canUpdate: jasmine.createSpy('canUpdateSome2').and.returnValue({allow: ['one']})
  };
  let AllowSome2Model = null;

  const AllowNoneSchema = mongoose.Schema({one: String, two: String});
  const allowNoneSettings = {
    canUpdate: jasmine.createSpy('canUpdateNone').and.returnValue([])
  };
  let AllowNoneModel = null;

  const DisallowSomeSchema = mongoose.Schema({one: String, two: String});
  const disallowSomeSettings = {
    canUpdate: jasmine.createSpy('canUpdateNotAll').and.returnValue({disallow: ['one']})
  };
  let DisallowSomeModel = null;

  const DenyAllSchema = mongoose.Schema({one: String, two: String});
  const denyAllSettings = {
    canUpdate: jasmine.createSpy('canUpdateDeny').and.returnValue(false)
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
    AllowAllModel = mongoose.model('allowAllUpdate', AllowAllSchema, 'testcollection');

    AllowSomeSchema.plugin(plugin, allowSomeSettings);
    AllowSomeModel = mongoose.model('allowSomeUpdate', AllowSomeSchema, 'testcollection');

    AllowSome2Schema.plugin(plugin, allowSome2Settings);
    AllowSome2Model = mongoose.model('allowSomeTwoUpdate', AllowSome2Schema, 'testcollection');

    AllowNoneSchema.plugin(plugin, allowNoneSettings);
    AllowNoneModel = mongoose.model('allowNoneUpdate', AllowNoneSchema, 'testcollection');

    DisallowSomeSchema.plugin(plugin, disallowSomeSettings);
    DisallowSomeModel = mongoose.model('disallowSomeUpdate', DisallowSomeSchema, 'testcollection');

    DenyAllSchema.plugin(plugin, denyAllSettings);
    DenyAllModel = mongoose.model('denyAllUpdate', DenyAllSchema, 'testcollection');

    AllowDefaultSchema.plugin(plugin, allowDefaultSettings);
    AllowDefaultModel = mongoose.model('allowDefaultUpdate', AllowDefaultSchema, 'testcollection');

    DenyDefaultSchema.plugin(plugin, denyDefaultSettings);
    DenyDefaultModel = mongoose.model('denyDefaultUpdate', DenyDefaultSchema, 'testcollection');

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

  describe('Update-Save', function() {
    it('should do allow when canUpdate returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          expect(allowAllSettings.canUpdate).toHaveBeenCalled();
          expect(allowAllSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields when canUpdate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          return newItem.save();
        })
        .then(function() {
          expect(allowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(allowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields when canUpdate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          return newItem.save();
        })
        .then(function() {
          expect(allowSome2Settings.canUpdate).toHaveBeenCalled();
          expect(allowSome2Settings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow no-fields when canUpdate returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          // just save again?
          return newItem.save();
        })
        .then(function() {
          expect(allowNoneSettings.canUpdate).toHaveBeenCalled();
          expect(allowNoneSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow disallow-some-fields when canUpdate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do deny some-fields when canUpdate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(allowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny some-fields when canUpdate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSome2Settings.canUpdate).toHaveBeenCalled();
          expect(allowSome2Settings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny no-fields when canUpdate returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          return newItem.save();
        })
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowNoneSettings.canUpdate).toHaveBeenCalled();
          expect(allowNoneSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should do deny disallow-some-fields when canUpdate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          return newItem.save();
        })
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should block when canUpdate returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canUpdate).toHaveBeenCalled();
          expect(denyAllSettings.canUpdate).toHaveBeenCalledWith(mockRequest, newItem);
          done();
        });
    });

    it('should default to allow when canUpdate is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block when canUpdate is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      const newItem = new SafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          newItem.one = 'new value';
          newItem.two = 'new value';
          return newItem.save();
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
          newItem.one = 'new value';
          newItem.two = 'new value';
          return newItem.save();
        })
        .then(function() {
          expect(denyAllSettings.canUpdate).not.toHaveBeenCalled();
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

      newItem.one = 'new value';
      newItem.two = 'new value';

      newItem
        .save()
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canUpdate).not.toHaveBeenCalled();
          done();
        });
    });
  });

  describe('Update', function() {
    let savedItemId = null;

    beforeEach(function(done) {
      const UnsafeModel = AllowAllModel.unsafeModel();

      const newItem = new UnsafeModel({
        one: 'value',
        two: 'value'
      });

      newItem
        .save()
        .then(function() {
          savedItemId = newItem._id;
          done();
        })
        .catch(done);
    });



    it('should do allow when canUpdate returns true', function(done) {
      const mockRequest = {};
      const SafeModel = AllowAllModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          expect(allowAllSettings.canUpdate).toHaveBeenCalled();
          expect(allowAllSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields when canUpdate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          expect(allowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(allowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do allow some-fields when canUpdate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          expect(allowSome2Settings.canUpdate).toHaveBeenCalled();
          expect(allowSome2Settings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    // TODO: sounds like a great test, but Mongoose doesn't bother with empty updates.
    // it('should do allow no-fields when canUpdate returns empty array', function(done) {
    //   const mockRequest = {};
    //   const SafeModel = AllowNoneModel.protect(mockRequest);

    //   const setQuery = {$set: {}};

    //   SafeModel
    //     .update({_id: savedItemId}, setQuery)
    //     .then(function() {
    //       expect(allowNoneSettings.canUpdate).toHaveBeenCalled();
    //       expect(allowNoneSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
    //       done();
    //     }).catch(function(err) {
    //       done.fail(`Should not catch with "${err.message || err}"`);
    //     });
    // });

    it('should do allow disallow-some-fields when canUpdate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const setQuery = {$set: {
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should do deny some-fields when canUpdate returns array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSomeModel.protect(mockRequest);

      const setQuery = {$set: {
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(allowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        });
    });

    it('should do deny some-fields when canUpdate returns object', function(done) {
      const mockRequest = {};
      const SafeModel = AllowSome2Model.protect(mockRequest);

      const setQuery = {$set: {
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowSome2Settings.canUpdate).toHaveBeenCalled();
          expect(allowSome2Settings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        });
    });

    it('should do deny no-fields when canUpdate returns empty array', function(done) {
      const mockRequest = {};
      const SafeModel = AllowNoneModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(allowNoneSettings.canUpdate).toHaveBeenCalled();
          expect(allowNoneSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        });
    });

    it('should do deny disallow-some-fields when canUpdate returns disallow', function(done) {
      const mockRequest = {};
      const SafeModel = DisallowSomeModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not succeed');
        }).catch(function(err) {
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalled();
          expect(disallowSomeSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        });
    });

    it('should block when canUpdate returns false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyAllModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          expect(denyAllSettings.canUpdate).toHaveBeenCalled();
          expect(denyAllSettings.canUpdate).toHaveBeenCalledWith(mockRequest, jasmine.any(SafeModel));
          done();
        });
    });

    it('should default to allow when canUpdate is undefined', function(done) {
      const mockRequest = {};
      const SafeModel = AllowDefaultModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should default block when canUpdate is false', function(done) {
      const mockRequest = {};
      const SafeModel = DenyDefaultModel.protect(mockRequest);

      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      SafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not allow access');
        }).catch(function(err) {
          done();
        });
    });

    it('should always allow for unsafe model', function(done) {
      const UnsafeModel = DenyAllModel.unsafeModel();

      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      UnsafeModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          expect(denyAllSettings.canUpdate).not.toHaveBeenCalled();
          done();
        }).catch(function(err) {
          done.fail(`Should not catch with "${err.message || err}"`);
        });
    });

    it('should error if not unsafe or protected', function(done) {
      const setQuery = {$set: {
        one: 'new value',
        two: 'new value'
      }};

      AllowAllModel
        .update({_id: savedItemId}, setQuery)
        .then(function() {
          done.fail('Should not have succeeded');
        }).catch(function(err) {
          expect(allowAllSettings.canUpdate).not.toHaveBeenCalled();
          done();
        });
    });
  });

});
