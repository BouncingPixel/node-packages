# massive-pg-db

Helper to help with using MassiveJS with Postgres on projects.
Makes initialization, managing instance, and creating a Session Store easier.

## Working With

### Requirements

- Postgres server
- massive ^3.0.0
- express ^4.13.4
- nconf ^0.8.4

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/massive-pg-db

$ yarn add @bouncingpixel/massive-pg-db
```

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `massivejs:connectString`
  The connect string to connect to postgres.

#### Optional
- `massivejs:scriptsPath`
  The path to any scripts to load. It will default to `./db` in the current working directory.

- `massivejs:sessiontable`
  The name of the session table to use with the Session Store

### Using {package-name}

The must be initialized before using. The `init` function will make the connection to postgres.
The `init` function takes no parameters.

The `getSessionStore` takes an optional `options` parameters which can define additional options on the `connect-pg-simple` middleware.
When using the sessions, first be sure to add the session table to the database.
See [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple) for the table.sql.
The table name may be changed, but must match the same as the config `massivejs:tablename` or the default `session`.

```ts
init(): Promise

getSessionStore(expressSession: ExpressSession, options?: any): SessionStore
```
