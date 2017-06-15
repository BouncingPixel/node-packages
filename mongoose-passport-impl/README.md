# mongoose-passport-impl

An implementation for the passport-auth package with mongoose as the data store.
Built in models securely track Remember-me tokens and login brute-force prevention through account locking.

## Working With

### Requirements

- NodeJS 6 LTS
- Mongoose 4.x
- @bouncingpixel/mongoose-db (suggested, though not a hard requirement)
- @bouncingpixel/passport-auth (suggested, this impl package is built for this)

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/mongoose-passport-impl

$ yarn add @bouncingpixel/mongoose-passport-impl
```

### Configuration and Use

A `UserModel` must be set before using this package. A User schema and model are not provided, as everyone may have their own requirements.

If using single sign on capability, a function `ssoExtendProfileFn` may be defined to allow you to parse the profile received from the sign on source and set the user's properties based on the profile.

```js
const passportImpl = require('@bouncingpixel/mongoose-passport-impl');
passportImpl.UserModel = require('./models/my-user-model');

// optional:
passportImpl.ssoExtendProfileFn = function(user, ssoProfile) {
  // ...
};
```

To enable this module with @bouncingpixel/passport-auth, be sure to set the nconf key `passportAuthImpl` to `@bouncingpixel/mongoose-passport-auth`.
