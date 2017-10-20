'use strict';

const multer = require('multer');
const csrf = require('csurf');
const mime = require('mime');
const async = require('async');
const bluebird = require('bluebird');
const fs = require('fs');
const path = require('path');
const contentType = require('content-type');
const fsunlink = bluebird.promisify(fs.unlink);

const BadRequestError = require('@bouncingpixel/http-errors').BadRequestError;

const nconf = require('nconf');
const rackspaceDirectory = nconf.get('rackspaceDirectory') || '';

// defaults to the tmpdir returned by `os`, though
const tmpPath = nconf.get('rackspaceTmpDir') || require('os').tmpdir();

const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tmpPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const uploaderFactory = multer({storage: uploadStorage});
const checkFileMimeFactory = require('./check-file-mime-factory');

const RackspaceService = require('./rackspace-service');

// fields: an array of objects containing:
//    field: the name of the POST field with the file
//    isRequired: boolean to denote if the file is required (true) or optional (false)
//    maxSize: optional maximum file size, this is 10MB. defaults to allow all sizes
//    filename: function to determine the name of the file to store in Rackspace
//              receives 2 parameters: req and the uploaded filename. return full file name including extension
//    mimetypes: the allowed mime types to be uploaded, will be based on the extension of the file uploaded.
//               If empty or unset, this will allow all files to be uploaded.
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
          return Promise.reject(new BadRequestError(`The file for ${fieldName} is missing`));
        }
      }

      if (fieldInfo.maxSize && req.files[fieldName] && req.files[fieldName].length) {
        const mimetypes = fieldInfo.mimetypes;

        const tooLarge = req.files[fieldName].filter(f => f.size > fieldInfo.maxSize);
        const invalidMimes = req.files[fieldName].filter(checkFileMimeFactory(mimetypes));

        if (tooLarge.length) {
          const files = tooLarge.map(f => f.filename).join(', ');
          return Promise.reject(new BadRequestError(`The files ${files} are too large`));
        }

        if (invalidMimes.length) {
          const files = invalidMimes.map(f => f.filename).join(', ');
          return Promise.reject(new BadRequestError(`The files ${files} are the incorrect type`));
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
          const filename = rackspaceDirectory + fieldInfo.filename(req, tmpFileName, fileindex);

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
    if (contentType.parse(req).type !== 'multipart/form-data') {
      next(new Error('Form must have enctype="multipart/form-data" in order to do file uploads'));
      return;
    }

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
