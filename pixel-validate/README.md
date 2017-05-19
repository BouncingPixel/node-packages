# pixel-validate

Server and browser side validation when working with Mongoose models.
Server side uses is an Express Middleware.
Browser side uses a jQuery plugin.

## Working With

### Requirements

- NodeJS 6 LTS
- webpack or similar for browser side
- Mongoose v4.x server side and browser side
- Recommend using either CDN or self-hosted version 4.0.2 of the mongoose.js for browser
- jQuery for the browser version only

### Using pixel-validate

Export your schemas separately from the models as this package works directly with schemas.

#### Server side

Import the server side portion and use the middleware in any route.
You may need to do some data manipulation before running the middleware, especially with arrays.
If the validation fails, the error is set as a 400 Bad Request.
This error could be caught by an Express error handling middleware or sent to the client as is.

```js
const ValidateMiddlware = require('@bouncingpixel/pixel-validate').ValidateMiddlware;
const MySchema = require('../../schemas/my-schema');

router.post(
  '/edit-thing/:id',

  // do data manipulation before validation to deserialize arrays
  MyController.thingEditDeserialize,

  // do the validation
  ValidateMiddlware(MySchema, '/admin/things'),

  // handle after everything is ok
  MyController.editThing
);
```

#### Browser side

Requires webpack or similar to handle `require` statements.
jQuery and Mongoose's 4.0.2 browser `mongoose.js` should be exposed externally or bundled.

After that, just import pixel-validate, your schemas, and attach the validator to your form.

The validator will automatically add the classes `valid` and `invalid` to fields.
Fields will be validated when focus is lost or when a form button is clicked.
Fields that contain a `name` attribute will use the name to find the right path in the schema.
Fields may also use the attribute `data-validate-path` to specify an exact path.
This attribute may be useful for fields which are not sent to the server and should not have a `name`.

Fields may also use the following data attributes to adjust their behavior:
- `data-is-array`: If the field is a comma separated list of values, the field will be deserialized into an array
- `data-empty-as-null`: Treats the field as `null` if the field is empty
- `data-skip-validation`: Ignores any validation errors on the field
- `data-ignore-empty`: Ignores the field if it is empty

All submit buttons will be caught, validated, and then the button fired again to perform it's default action.
This module does **not** catch the form submit event.
This is done to avoid using Ajax to submit forms and also to make sure the button's `name` is attached to the body.

Optionally, if additional data processing must occur prior to validation, use the optional function `postSerialize`.

```js
requirerequire('@bouncingpixel/pixel-validate');
const MySchema = require('../../schemas/my-schema.js');

$('#myform').pixelValidate(MySchema, {
  postSerialize: function(data) {
    // do things to data
    // returning is optional if directly manipulating data. otherwise, return the new data object.
    return data;
  }
});
```
