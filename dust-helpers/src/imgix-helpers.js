module.exports = function(dust) {
  // params:
  // image - the image name, such as: products/001.png
  // cropInfo - optional object with x,y,w,h for cropping
  // sizes - a JSON-string encoded array of sizes info, where each item is an array. index 0: screen width, 1: img width, 2: img height.
  // defaultImage - optional default to use if the image above fails to load
  dust.helpers.imgix = function(chunk, context, bodies, params) {
    var image = params.image;
    var cropInfo = params.cropInfo;
    var defaultFit = params.fit || 'crop';

    var cropRect = (image && cropInfo) ?
      ('rect=' + [cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h].join(',')) :
      null;

    var imgixUrl = context.get('ENV.imgixUrl');

    var sizes = (params.sizes && params.sizes.length)
    ? JSON.parse(params.sizes) :
    [];
    var defaultImage = params.defaultImage || context.get('imgixDefaultImage') || '';
    var className = params.className || 'image';

    var imageUrlParams = [];

    if (cropRect) {
      imageUrlParams.push(cropRect);
      imageUrlParams.push('fit=crop');
    }

    var imagePath = image ? (imgixUrl + image + '?') : defaultImage;

    var srcset = sizes.map(function(size) {
      var screenw = size[0];
      var sizeparams = size[1];

      var retparams = imageUrlParams.slice();

      if (sizeparams && sizeparams.length) {
        if (sizeparams.indexOf('fit=') === -1) {
          retparams.push('fit=' + defaultFit);
        }

        retparams.push(sizeparams);
      } else {
        retparams.push('fit=' + defaultFit);
      }

      return imagePath + retparams.join('&') + ' ' + screenw + 'w';
    });

    if (srcset.length && sizes[0][1] && sizes[0][1].length) {
      if (sizes[0][1].indexOf('fit=') === -1) {
        imageUrlParams.push('fit=' + defaultFit);
      }
      imageUrlParams.push(sizes[0][1]);
    }

    var src = imagePath + imageUrlParams.join('&');

    var srcsetStr = srcset.length ? ('srcset="' + srcset.join(', ') + '"') : '';

    var onError = defaultImage ? 'onerror="this.src=\'' + defaultImage + '\'"' : '';

    return chunk.write(`<img class="${className}" ${srcsetStr} src="${src}" ${onError}>`);
  };

  dust.helpers.imgixUrl = function(chunk, context, bodies, params) {
    var image = params.image;
    var cropInfo = params.cropInfo;

    var width = params.width;
    var height = params.height;

    var cropRect = (image && cropInfo) ? ('rect=' + [cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h].join(',')) : null;

    var imgixUrl = context.get('ENV.imgixUrl');

    var imgparams = [];
    if (cropRect) {
      imgparams.push(cropRect);
      imgparams.push('fit=crop');
    }

    if (width) {
      imgparams.push('w=' + width);
    }
    if (height) {
      imgparams.push('h=' + height);
    }

    var imageUrl = image ? (imgixUrl + image + '?' + imgparams.join('&')) : '';

    return imageUrl;
  };
};
