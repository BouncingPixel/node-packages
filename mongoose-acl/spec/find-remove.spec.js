const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;

mongoose.Promise = bluebird;
const mockgoose = new Mockgoose(mongoose);

const plugin = require('..');

describe('findAndRemove', function() {
  const basicSchema = {one: String, two: String};

  const options = [
    // the expected passes:
    {
      canRead: true,
      canDelete: true,
      expect: true
    },
    {
      canRead: undefined,
      canDelete: true,
      expect: true
    },
    {
      canRead: true,
      canDelete: undefined,
      expect: true
    },
    {
      canRead: undefined,
      canDelete: undefined,
      expect: true
    },

    // and the expected failures:
    {
      canRead: true,
      canDelete: false,
      expect: false
    },
    {
      canRead: false,
      canDelete: true,
      expect: false
    },
    {
      canRead: false,
      canDelete: false,
      expect: false
    },
    {
      canRead: true,
      canDelete: null,
      expect: false
    },
    {
      canRead: null,
      canDelete: true,
      expect: false
    },
    {
      canRead: null,
      canDelete: null,
      expect: false
    },
    {
      canRead: undefined,
      canDelete: false,
      expect: false
    },
    {
      canRead: false,
      canDelete: undefined,
      expect: false
    },
    {
      canRead: false,
      canDelete: null,
      expect: false
    },
    {
      canRead: null,
      canDelete: false,
      expect: false
    },
    {
      canRead: null,
      canDelete: undefined,
      expect: false
    },
    {
      canRead: undefined,
      canDelete: null,
      expect: false
    }
  ];

  const tests = options.map(function(testOptions) {
    const TestSchema = mongoose.Schema(basicSchema);
    const settings = {};

    let testname = ['findremove'];

    if (testOptions.canRead === null) {
      settings.canRead = null;
      testname.push('rdd');
    } else if (testOptions.canRead === true) {
      settings.canRead = jasmine.createSpy('canReadAllow').and.returnValue(true);
      testname.push('ra');
    } else if (testOptions.canRead === false) {
      settings.canRead = jasmine.createSpy('canReadDeny').and.returnValue(false);
      testname.push('rd');
    } else {
      testname.push('rda');
    }

    if (testOptions.canDelete === null) {
      settings.canDelete = null;
      testname.push('ddd');
    } else if (testOptions.canDelete === true) {
      settings.canDelete = jasmine.createSpy('canDeleteAllow').and.returnValue(true);
      testname.push('da');
    } else if (testOptions.canDelete === false) {
      settings.canDelete = jasmine.createSpy('canDeleteDeny').and.returnValue(false);
      testname.push('dd');
    } else {
      testname.push('dda');
    }

    TestSchema.plugin(plugin, settings);

    return {
      schema: TestSchema,
      testname: testname.join('_'),
      settings: settings,
      options: testOptions,
      model: null
    };
  });

  beforeAll(function(done) {
    tests.forEach(function(test) {
      const Model = mongoose.model(test.testname, test.schema, 'testcollection');
      test.model = Model;
    });

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

  let savedItemId = null;
  beforeEach(function(done) {
    tests.forEach(function(test) {
      for (let p in test.settings) {
        if (test.settings[p]) {
          test.settings[p].calls.reset();
        }
      }
    });

    const UnsafeModel = tests[0].model.unsafeModel();

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

  afterEach(function(done) {
    // clear all models out after each run
    tests[0].model
      .remove({})
      .then(function() {
        done();
      }).catch(done);
  });

  tests.forEach(function(test) {
    const RawModel = test.model;

    it(test.testname, function(done) {
      const mockreq = {};
      const SafeModel = RawModel.protect(mockreq);

      SafeModel
        .findAndRemove({_id: savedItemId})
        .then(function(item) {
          if (test.expect) {
            done();
          } else {
            done.fail('Should not have allowed access');
          }
        })
        .catch(function(err) {
          if (test.expect) {
            done.fail(`Should not catch with "${err.message || err}"`);
          } else {
            done();
          }
        });
    });
  });

  // TODO: also the unsafe and unprotected tests
});
