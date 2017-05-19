module.exports = function(dust) {
  // params:
  // image - the image name, such as: products/001.png
  // cropInfo - optional object with x,y,w,h for cropping
  // sizes - a JSON-string encoded array of sizes info, where each item is an array. index 0: screen width, 1: img width, 2: img height.
  // defaultImage - optional default to use if the image above fails to load
  dust.helpers.imgix = function(chunk, context, bodies, params) {
    const image = params.image;
    const cropInfo = params.cropInfo;
    const defaultFit = params.fit || 'crop';

    const cropRect = (image && cropInfo) ?
      ('rect=' + [cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h].join(',')) :
      null;

    const imgixUrl = context.get('ENV.imgixUrl');

    const sizes = (params.sizes && params.sizes.length)
      ? JSON.parse(params.sizes) :
      [];
    const defaultImage = params.defaultImage || context.get('imgixDefaultImage') || '';
    const className = params.className || 'image';

    let imageUrlParams = [];

    if (cropRect) {
      imageUrlParams.push(cropRect);
      imageUrlParams.push('fit=crop');
    }

    const imagePath = image ? (imgixUrl + image + '?') : defaultImage;

    const srcset = sizes.map(function(size) {
      const screenw = size[0];
      const sizeparams = size[1];

      let retparams = imageUrlParams.slice();

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

    const src = imagePath + imageUrlParams.join('&');

    const srcsetStr = srcset.length ? ('srcset="' + srcset.join(', ') + '"') : '';

    const onError = defaultImage ? 'onerror="this.src=\'' + defaultImage + '\'"' : '';

    return chunk.write(`<img class="${className}" ${srcsetStr} src="${src}" ${onError}>`);
  };

  dust.helpers.imgixUrl = function(chunk, context, bodies, params) {
    const image = params.image;
    const cropInfo = params.cropInfo;

    const width = params.width;
    const height = params.height;

    const cropRect = (image && cropInfo) ? ('rect=' + [cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h].join(',')) : null;

    const imgixUrl = context.get('ENV.imgixUrl');

    const imgparams = [];
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

    const imageUrl = image ? (imgixUrl + image + '?' + imgparams.join('&')) : '';

    return imageUrl;
  };
};
