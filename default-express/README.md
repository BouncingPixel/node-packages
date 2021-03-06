# default-express

The default express set up used for many projects.

## Working With

### Requirements

- NodeJS >=10.0.0
- other requirements

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

See additional information for:
- [dust-helpers](https://github.com/BouncingPixel/node-packages/tree/master/dust-helpers)
- [error-router](https://github.com/BouncingPixel/node-packages/tree/master/error-router)
- [express-async-patch](https://github.com/BouncingPixel/node-packages/tree/master/express-async-patch)
- [express-handler-routing](https://github.com/BouncingPixel/node-packages/tree/master/express-handler-routing)
- [express-view-routing](https://github.com/BouncingPixel/node-packages/tree/master/express-view-routing)
- [http-errors](https://github.com/BouncingPixel/node-packages/tree/master/http-errors)
- [universal-response](https://github.com/BouncingPixel/node-packages/tree/master/universal-response)
- And any additional packages you may require in.

#### Required
- `sessionSecret`
  The secret to use for securing session cookies.
- `PORT`
  The port to start Express on.

#### Optional
- `siterootHost`
  The domain of the site, used in canonical URLs and emails sent out, but can be used in other places with redirects.
- `forceDomain`
  Set to true if the site should redirect to force the `domain` listed. Defaults to `false`.
- `requireHTTPS`
  Set to true if the site should use HTTPS in all URLs (such as canonical). Defaults to `false`.
- `httpsRedirect`
  Set to true if the site should redirect to HTTPS. You might want false and let CloudFlare do it. Defaults to `false`.
- `gatrackerid`
  The tracker ID for Google Analytics. When set, the GA code will be added to the page.
- `facebookpixelcode`
  The tracker ID for Facebook Pixel. When set, the Facebook Pixel code will be added to the page.
- `WEBTOOLS_VERIF_ID`
  Can be set to the ID needed by Webmaster Tools verification to create the .html page with the necessary content.
- `client`
  An optional object and have other keys defined within it. These keys are exported to the `/js/config.js` as well as Dust under `ENV.`
- `webpackConfigPath`
  The path to the webpack config file if `webpack-dev-middleware` is desired.
- `routesPath`
  The path to the routes folder to automatically generate routes. Defaults to `./server/routes`.
- `viewPagesFolder`
  The name of the folder in the views directory to automatically generate routes. Defaults to `pages`.

### Using default-express

Install `@bouncingpixel/default-express`. Call `.init()` without a parameter or with one parameter that contains the list of initializers. Initializers may be built-in module specified by the name, such as `cookie-parser` or `error-router`, or can be a function which takes one parameter, the Express app, and may return a Promise for async behavior.

```js
const DefaultExpress = require('@bouncingpixel/default-express');

DefaultExpress.init(
  // you could optionally pass a different list of initializers here
);
```

**NOTE** If you make use of `mongoose-db` and/or `passport-auth`, those package must be initialized before requiring in `default-express`.

#### Adding routes

See [express-handler-routing](https://github.com/BouncingPixel/node-packages/tree/master/express-handler-routing)

Also See [express-view-routing](https://github.com/BouncingPixel/node-packages/tree/master/express-view-routing)
