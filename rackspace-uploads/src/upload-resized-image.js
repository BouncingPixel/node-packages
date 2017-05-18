'use strict';

const multer = require('multer');
const csrf = require('csurf');
const mime = require('mime');
const async = require('async');
const bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');
const fsunlink = bluebird.promisify(fs.unlink);

const gm = require('gm');
const imageMagick = gm.subClass({ imageMagick: true });

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
//    maxSize: optional int to denote the maximum file size in bytes that is allowed.
//    filename: the name of the file to use
//              receives 2 parameters: req and the uploaded filename. returns filename excluding extension
//    extention: the desired final extension to use (will convert from any to desired)
//    out: object where key is a string that will be inserted into the filename (filename + key + extension)
//         the value points to an array of objects with (or an empty array to just make sure extension is correct):
//              fn: string (crop, resize, etc; functions from imageMagick)
//              args: array of args to pass into imageMagick
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
      // determine all the uploads and derivatives to make first, then use a mapSeries style to perform actions
      const actionCalls = fields.reduce(function(proms, fieldInfo) {
        const fieldName = fieldInfo.field;
        const fieldOutputs = Object.keys(fieldInfo.out);

        if (!req.files[fieldName] || req.files[fieldName].length === 0) {
          // just ignore it since it must be optional to get here
          return proms;
        }

        if (!req.uploads) {
          req.uploads = {};
        }
        req.uploads[fieldName] = [];

        req.files[fieldName].forEach(function(file, fileindex) {
          if (file.size <= 0) {
            return;
          }

          const tmpFileName = file.filename;
          const filename = fieldInfo.filename(req, tmpFileName, fileindex);
          const extension = fieldInfo.extension;

          let uploads = {};
          req.uploads[fieldName].push(uploads);

          fieldOutputs.forEach(function(key) {
            const newFileName = key.length ? `${filename}_${key}.${extension}` : `${filename}.${extension}`;
            uploads[key] = newFileName;
            proms.push([
              tmpFileName,
              newFileName,
              extension,
              fieldInfo.out[key]
            ]);
          });
        });
        return proms;
      }, []);

      // use a promise style mapSeries in order to prevent overwhelming Rackspace
      let current = Promise.resolve();
      return Promise.all(actionCalls.map(function(callargs) {
        current = current.then(function() {
          return performActionsAndUpload.apply(null, callargs);
        });
        return current;
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

function performActionsAndUpload(tmpFileName, newFileName, extension, operations) {
  const mimetype = mime.lookup(extension);

  return new Promise((resolve, reject) => {
    const imgToStream = operations.reduce(function(img, operation) {
      return img[operation.fn].apply(img, operation.args);
    }, imageMagick(path.resolve(tmpPath, tmpFileName)));

    imgToStream.stream(extension, function(err, stdout, _stderr) {
      if (err) {
        reject(err);
        return;
      }

      resolve(stdout);
    });
  }).then(function(stdout) {
    return RackspaceService.uploadStreamAsync({
      filename: newFileName,
      mimeType: mimetype,
      stream: stdout
    });
  });
}
