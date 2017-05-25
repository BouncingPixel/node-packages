# express-async-patch

Patches Express 4.x to support generators (via bluebird-coroutine) and async.

## Working With

### Requirements

- NodeJS 6+ LTS for generator support
- NodeJS 7.5+ LTS for async and generator support
- Express 4.x

### Using express-async-patch

Simply require in the package and pass your Express instance into the function.
This will wrap both the Express instance and also all instances of Express.Router.

Middleware will still need to call the `next()` to signal to continue processing.
Error middleware still require all 4, `(err, req, res, next)`, parameters.

This does **not** enable Koa-like support for yield/await `next` to continue processing later.

```js
const express = require('express');
const app = express();

require('@bouncingpixel/express-async-patch')(app);

app.use(function*(req, res, next) {
  yield getAPromise();
  next();
});

app.use(async function(req, res, next) {
  await onAPromise();
  next();
});

app.get(
  '/myroute',

  async function(req, res, next) {
    res.locals.data = await getData();
    next();
  },

  function*(req, res) {
    res.render('mypage');
  },

  async function(err, req, res, next) {
    res.render('specialerror');
  }
);
```
