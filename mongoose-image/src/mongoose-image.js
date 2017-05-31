/*
This plugin only generates the upload spec.
The schema docs do all the other magic

image: {
  type: require('@bouncingpixel/mongoose-image/schemas/imgix'),
  default is fine, but people should know its a path to a file
  required: true/false, defaults false

  maxsize: false/null/undefined or a number in bytes
  mimetype: false/null/undefined or a single mimetype or an array of mimetypes
  convert: false/null/undefined or an array of mimetypes that can be converted from
}

*/

'use strict';

const bytes = require('bytes');
const nconf = require('nconf');
const shortid = require('shortid');
const logger = require('winston');

module.exports = function MongooseImage(schema, options) {
  const filenameGenerator = options.filenameGenerator || defaultFilenameGenerator;

  // gets a spec for use with `rackspace-uploads`
  // isCreate: a required image is required at init, but reused at other times
  schema.statics.uploadSpec = function(isCreate) {
    // scan through all paths
    // gather all the ones that are of imgix/imgixset/image/imageset
    // get the options
    // also, recursion somehow...

    const imagePaths = [];
    findAllPaths(imagePaths, [], this.schema);

    return imagePaths.map(function(path) {
      const isArray = path.path.some(p => p.isArray);
      const fieldName = path.path.map(p => p.isArray ? (p.p + '[]') : p.p);
      let isRequired = false;
      if (isCreate && )

      const pathSpec = {
        field: fieldName,
        isRequired: true,
        maxFiles: isArray ? 5 : 1,
        filename: filenameGenerator,

        mimetypes: path.options.mimetype,
        allowConversion: false,

        out: {
          '': []
        }
      };

      if (path.options.maxsize) {
        pathSpec.maxSize = bytes.parse(path.options.maxsize);
      }

      if (path.options.convert) {
        pathSpec.allowConversion = path.options.convert;
      }

      // only used by image and imageset
      if (path.options.derivatives) {
        for (let derivProp in path.options.derivatives) {
          pathSpec.out[derivProp] = path.options.derivatives[derivProp];
        }
      }

      return pathSpec;
    });
  };
};

function findAllPaths(result, path, schema) {
  for (let p in schema.paths) {
    const pathInfo = schema.paths[p];
    const isArray = pathInfo.instance === 'Array';

    const thisPath = path.concat({p, isArray});

    if (pathInfo.schema === imgixset) {
      result.push({
        path: thisPath,
        options: pathInfo.options
      });
      // console.log(p);
      // console.log(pathInfo.options);
    } else if (pathInfo.schema && pathInfo.schema.paths) {
      findAllPaths(result, thisPath, pathInfo.schema);
    }
  }
}

function defaultFilenameGenerator(_req, _file) {
  return shortid.generate();
}
