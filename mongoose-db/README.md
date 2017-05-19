# mongoose-db

A mongoosedb adapter for use with Node apps at Bouncing Pixel.
Implements necessary functions for use with `passport-auth`.
Can generate a Mongo based session store if desired.

## Working With

### Requirements

- NodeJS 6 LTS
- MongoDB 3.x
- Mongoose v4.7.x

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `{mongoConnectStr}`
  The connection string to the mongo database. Example: `mongodb://user:pass@mydbhost:12345/mydbname`.

### Using mongoose-db

Be sure to add `mongoose` to your app before using this module.
The must be initialized before using. The `init` function will make the connection to mongo.
The `init` function can take an optional path to the models directory and pre-load all models.

```ts
init(modelsDirectory?: string): Promise

getSessionStore(expressSession: ExpressSession): MongoStore

passportImplFactory(User: DatabaseModel, ssoExtendProfileFn?: (user, ssoProfile) => Promise)
```
