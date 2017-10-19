'use strict';

const multer = require('multer');
const csrf = require('csurf');
const mime = require('mime');
const async = require('async');
const bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');
const fsunlink = bluebird.promisify(fs.unlink);

const BadRequestError = require('@bouncingpixel/http-errors').BadRequestError;

const nconf = require('nconf');
const rackspaceDirectory = nconf.get('rackspaceDirectory') || '';

const gm = require('gm');
const imageMagick = gm.subClass({ imageMagick: true });

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

function validateFieldSpec(field) {
  if (field.mimetypes === null) {
    throw new Error('Missing mimetypes specification for upload');
  }

  if (Array.isArray(field.mimetypes) && field.mimetypes.length === 0) {
    throw new Error('Mimetypes spec when an array must contain at least 1 item');
  }

  if (field.field == null || typeof field.field !== 'string' || field.field.length === 0) {
    throw new Error('The field for uploads must be set, must be a string, and must be a valid field name');
  }

  if (field.out == null || Object.keys(field.out).length === 0) {
    throw new Error('Missing out specification for upload');
  }

  if (field.maxSize != null && typeof field.maxSize !== 'number') {
    throw new Error('Max Size must be a number if set');
  }

  return true;
}

// fields: an array of objects containing:
//    field: the name of the POST field with the file
//    isRequired: boolean to denote if the file is required (true) or optional (false)
//    maxSize: optional int to denote the maximum file size in bytes that is allowed.
//    filename: the name of the file to use
//              receives 2 parameters: req and the uploaded filename. returns filename excluding extension
//    mimetypes: the allowed mime types to be uploaded, will be based on the extension of the file uploaded.
//               If empty or unset, this will error out.
//    allowConversion: can be falsey to do no conversions. If true, will convert anything not in `mimetypes` to the first listed.
//                     Can also be an array of mimetypes that are allowed to be converted.
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
  fields.forEach(validateFieldSpec);

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

      if (req.files[fieldName] && req.files[fieldName].length) {
        const mimetypes = fieldInfo.mimetypes;
        const allowConversion = fieldInfo.allowConversion;

        const tooLarge = fieldInfo.maxSize ? req.files[fieldName].filter(f => f.size > fieldInfo.maxSize) : [];
        const invalidMimes = req.files[fieldName].filter(checkFileMimeFactory(mimetypes, allowConversion));

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
          const originalMime = mime.lookup(tmpFileName);

          const filename = rackspaceDirectory + fieldInfo.filename(req, tmpFileName, fileindex);
          let extension = mime.extension(originalMime);

          const mimetypes = fieldInfo.mimetypes;

          // if it's one of the allowed ones, we leave it. otherwise, we convert
          // we've already validated we can convert it OR that the mime does match by this point
          if (Array.isArray(mimetypes)) {
            if (mimetypes.indexOf(originalMime) === -1) {
              extension = mime.extension(mimetypes[0]);
            }
          } else if (mimetypes !== originalMime) {
            extension = mime.extension(mimetypes);
          }

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
    if (req.headers['content-type'].toLowerCase !== 'multipart/form-data') {
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

function performActionsAndUpload(tmpFileName, newFileName, extension, operations) {
  const mimetype = mime.lookup(extension);

  return new Promise((resolve, reject) => {
    const imgToStream = operations.reduce(function(img, operation) {
      return img[operation.fn].apply(img, operation.args);
    }, imageMagick(path.resolve(tmpPath, tmpFileName)));

    function callback(err, stdout, _stderr) {
      if (err) {
        reject(err);
        return;
      }

      resolve(stdout);
    }

    if (extension) {
      imgToStream.stream(extension, callback);
    } else {
      imgToStream.stream(callback);
    }
  }).then(function(stdout) {
    return RackspaceService.uploadStreamAsync({
      filename: newFileName,
      mimeType: mimetype,
      stream: stdout
    });
  });
}
