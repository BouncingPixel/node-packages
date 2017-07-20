# config-loader

A multiple-file loader for managing configuration in nconf.

## Working With

### Requirements

- nconf

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/config-loader

$ yarn add @bouncingpixel/config-loader
```

### Using config-loader

Create a directory for your config files.
Inside this directory, you may place your config files, which may be JSON or JS files that export a JS object.

If there is a `default.json` or `default.js`, these will be applied as defaults in Nconf.
The JSON version will always load before the JS version.

If there is a `local.json` or `local.js`, these will be loaded last, as to override any other settings.
These local files should be excluded with .gitignore and only define settings unique to an installation.

All other files will be loaded in alphabetical order as defined by the operating system.
This could, unfortunately, mean that files are not loaded exactly the same between different OSes.
This could also mean that the order of JSON or JS could be different.
Only `default.json/js` and `local.json/js` have their orders explicitly defined.
It is not recommended to override items between files for this reason.
The settings objects are merged together, so you may define subproperties in different files.

Simply require in and pass the path to your config directory:

```js
require('@bouncingpixel/config-loader')(path.resolve(process.cwd(), 'config'));
```
