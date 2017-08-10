# massive-passport-impl

An implementation for the passport-auth package with massive (postgres) as the data store.
Built in models securely track Remember-me tokens and login brute-force prevention through account locking.

## Working With

### Requirements

- NodeJS 6 LTS
- Mongoose 4.x
- @bouncingpixel/massive-pg-db
- @bouncingpixel/passport-auth
- nconf

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/massive-passport-impl

$ yarn add @bouncingpixel/massive-passport-impl
```

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `massivepassport:usertable`
  The name of the table for the users

- `massivepassport:lockouttable`
  The name of the table used to track login failures for brute force protection

- `massivepassport:remembermetable`
  The name of the table used to map remember-me tokens to the user ID

### Using massive-passport-impl

First, create the tables using the provided SQL files.
The tables are used for limiting brute force login attempts and remember-me tokens.

Your user table must have:
- email (not null text)
- password (not null, 72 characters)
- role (not null, enum or string with at least "noaccess")
- deactivatedat (nullable, date)
- logintoken (nullable, 72 characters)
- tokenexpire (nullable, date)

The table names should be set in configuration.

If using single sign on capability, a function `ssoExtendProfileFn` may be defined to allow you to parse the profile received from the sign on source and set the user's properties based on the profile.

```js
// assuming the table names have been configured properly
const passportImpl = require('@bouncingpixel/massive-passport-impl');

// optional:
passportImpl.ssoExtendProfileFn = function(user, ssoProfile) {
  // ...
};
```

To enable this module with @bouncingpixel/passport-auth, be sure to set the nconf key `passportAuthImpl` to `@bouncingpixel/massive-passport-auth`.
