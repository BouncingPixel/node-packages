# algolia

Helpers for Algolia.
Currently only has a Mongoose model plugin that extends Mongoose models for Algolia methods.

## Working With

### Requirements

- NodeJS 6 LTS

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `algoliaAppId`
  The ID of the app in Algolia containing all the indecies.
- `algoliaApiKey`
  The read+write API key used on the server side. This should not be exposed to the client side.
- `algoliaIndexPrefix`
  All indecies should be named with the prefix, followed by underscore, followed by the name of the data model.
  The prefix allows for multiple instances (dev, staging, prod, per-user etc) to share an app ID and not conflict.
  Algolia does not have a naming standard, but this is what we have come up with and decided to follow.

#### Optional
- `client:algoliaSearchKey`
  The read only API key used on the client side. This is automatically exported to the client.
  This is optional if all searches are done server side. For client side, use the algoliasearch package.

### Using algolia

Algolia is a 3rd party search engine that can be integrated for searching a site's data.
Algolia is an optional utility that is not required, but is included as it commonly is required.

The provided Algolia integration acts as a plugin for Mongoose schemas. The plugin adds post-save hooks to automatically
synchronize data with Algolia. The plugin allows a person to define which fields to listen for changes if not all fields are desired.
The plugin can also automatically remove entries from Algolia when a field is set.
Functions will also be added to the model to query the search index and to save or remove a data object from Algolia.

The plugin assumes each model will have a separate search index. Currently, there is no support for an index with data
collected from multiple models. This functionality may be added later if there is a need for it.

To add the plugin to the schema, use the `plugin` method and pass any desired options for the plugin:

```js
MySchema.plugin(require('../utils/schemas/algolia-methods'), {
  autoSave: true, // boolean if the auto-save post-save hook should be enabled
  includeObjectInIndex: fn, // a function to determine if a particular object should be included in Algolia
  castToObject: fn, // a function to convert an object into the exact data format to be stored in Algolia
  indexName: str, // the name of the index. with the prefixing system, this is just the 2nd half of the Algolia index name
  errorsOnNotFound: false, // boolean if the function findOneUpdateAndSync does not find an object to update
  updateIfAnyField: null, // an array of fields that when changed, will cause an automatic sync to Algolia
                          // the default null will assume any change should be sync'd to Algolia
  removeIfFieldSet: ['removed'] // an array of fields that when set to a truthy value will remove the object from Algolia
                                // when unset, the object will be added to Algolia
});
```
