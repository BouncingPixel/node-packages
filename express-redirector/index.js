// example:
// const oldToNewRedirects = {
//   '/about': {
//     path: '/about-us',
//     status: 301
//   },
//   '/page/:pgnum': '/?page=${pgnum}',
//   '/posts/page/:pagenum': '/blog',
//   '/category/:category': '/blog/tag/${category}',
//   '/category/:category/page/:pgnum/': '/blog/tag/${category}?page=${pgnum}',
//   '/wp-content/uploads/:year/:month/:image': 'https://images,outsite.com/blog/${image}',
// };
// require('@bouncingpixel/express-redirector')(app, oldToNewRedirects)

module.exports = function(app, oldToNewRedirects) {
  for (const oldUrl in oldToNewRedirects) {
    const newInfo = oldToNewRedirects[oldUrl];

    let newUrl = null;
    let redirectCode = 302;

    if (typeof newInfo === 'string' || newInfo instanceof String) {
      newUrl = newInfo;
    } else {
      newUrl = newInfo.path;
      redirectCode = newInfo.status || 302;
    }

    if (!newUrl) {
      throw new Error('An old URL must map to a URL (string) or an object with "path" set');
    }

    const hasParams = oldUrl.indexOf('/:') !== -1;

    router.get(oldUrl, function(req, res) {
      if (!hasParams) {
        res.redirect(redirectCode, newUrl);
        return;
      }

      const formattedUrl = newUrl.replace(/\$\{([a-z]+)\}/g, function(match, param) {
        return req.params[param];
      });

      res.redirect(redirectCode, formattedUrl);
    });
  }
};
