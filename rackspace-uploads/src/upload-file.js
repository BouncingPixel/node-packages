'use strict';

const multer = require('multer');
const csrf = require('csurf');
const mime = require('mime');
const async = require('async');
const bluebird = require('bluebird');
const fs = require('fs');
const path = require('path');
const fsunlink = bluebird.promisify(fs.unlink);

const tmpPath = path.resolve(__dirname, '../../../tmp/');

const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tmpPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const uploaderFactory = multer({storage: uploadStorage});

const RackspaceService = require('../services/rackspace-service');

// fields: an array of objects containing:
//    field: the name of the POST field with the file
//    isRequired: boolean to denote if the file is required (true) or optional (false)
//    filename: function to determine the name of the file to store in Rackspace
//              receives 2 parameters: req and the uploaded filename. return full file name including extension
module.exports = function(fields) {
  if (!fields || fields.length === 0) {
    return function(req, res, next) {
      next();
    };
  }

  const uploader = uploaderFactory.fields(fields.map(function(item) {
    return { name: item.field, maxCount: item.maxFiles || 1 };
  }));

   // these are inside here, because we need the closure to contain fields
   // otherwise, we would use a factory that wraps with a closure anyway
  function afterMulter(req, res, next) {
    Promise.all(fields.map(function(fieldInfo) {
      const fieldName = fieldInfo.field;

      if (!req.files[fieldName] || req.files[fieldName].length === 0 || req.files[fieldName][0].size <= 0) {
        if (fieldInfo.isRequired) {
          return Promise.reject(ServerErrors.BadRequest(`The file for ${fieldName} is missing`));
        }
      }

      if (fieldInfo.maxSize && req.files[fieldName] && req.files[fieldName].length) {
        const tooLarge = req.files[fieldName].filter(f => f.size > fieldInfo.maxSize);
        if (tooLarge.length) {
          const files = tooLarge.map(f => f.filename).join(', ');
          return Promise.reject(ServerErrors.BadRequest(`The files ${files} are too large`));
        }
      }

      return Promise.resolve();
    })).then(function() {
      return Promise.all(fields.map(function(fieldInfo) {
        const fieldName = fieldInfo.field;

        if (!req.files[fieldName] || req.files[fieldName].length === 0) {
          // just ignore it since it must be optional to get here
          return Promise.resolve();
        }

        if (!req.uploads) {
          req.uploads = {};
        }
        req.uploads[fieldName] = [];

        return Promise.all(req.files[fieldName].map(function(file, fileindex) {
          if (file.size <= 0) {
            return Promise.resolve();
          }

          const tmpFileName = file.filename;
          const filename = fieldInfo.filename(req, tmpFileName, fileindex);

          req.uploads[fieldName].push(filename);

          return performActionsAndUpload(tmpFileName, filename);
        }));
      }));
    }).then(function() {
      cleanUpFiles(null, req, next);
    }).catch(function(err) {
      cleanUpFiles(err, req, next);
    });
  }

  function cleanUpFiles(err, req, next) {
    // make sure we clean up *all* uploaded files, even from unknown fields just in case.
    const fileProps = Object.keys(req.files);

    return Promise.all(fileProps.map(function(fieldName) {
      const files = req.files[fieldName];

      if (!Array.isArray(files) || !files.length) {
        return Promise.resolve();
      }

      return Promise.all(files.map(function(fileinfo) {
        const tmpFileName = fileinfo.filename;
        return fsunlink(path.resolve(tmpPath, tmpFileName));
      }));
    })).then(function() {
      next(err);
    }).catch(function(internalError) {
      next(internalError);
    });
  }

  // to abstract multer away, doing this to "inject" multer into the middleware stack
  return function(req, res, next) {
    async.series([
      function(cb) {
        uploader(req, res, cb);
      },
      function(cb) {
        csrf({cookie: true})(req, res, cb);
      },
      function(cb) {
        afterMulter(req, res, cb);
      }
    ], function(err) {
      next(err);
    });
  };
};

function performActionsAndUpload(tmpFileName, filename) {
  const extension = path.parse(filename).ext;
  const mimetype = mime.lookup(extension);

  return RackspaceService.uploadStreamAsync({
    filename: filename,
    mimeType: mimetype,
    stream: fs.createReadStream(path.resolve(tmpPath, tmpFileName))
  });
}
