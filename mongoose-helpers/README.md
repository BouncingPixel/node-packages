# mongoose-helpers

Collection of Mongoose schema plugins.

## Working With

### Requirements

- NodeJS 6 LTS

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/mongoose-helpers

$ yarn add @bouncingpixel/mongoose-helpers
```

### Using mongoose-helpers/auto-bcrypt

Just add the plugin to the schema and set the fields which are automatically bcrypt'd

```js
MySchema.plugin(require('@bouncingpixel/mongoose-helpers/auto-bcrypt'), {
  fields: ['password']
});
```

### Using mongoose-helpers/replace-image

Add the plugin to the schema, set the fields that are managed images, and set the remover function.

```js
MySchema.plugin(require('@bouncingpixel/mongoose-helpers/replace-image'), {
  fields: ['previewImage'],
  remover: RackspaceService.removeFile
});
```
