# mongoose-acl

A Mongoose plugin for access control protection in models.
The plugin offers the ability to define functions which can return whether a user has access to perform an action or query.
The plugin does provide Express middleware, but Express is not required for use with the plugin.

## Working With

### Requirements

- NodeJS 6 LTS
- other requirements

### Installing

Install the package using your JS package manager of choice, such as `npm` or `yarn`.

For example, with `npm` or `yarn`:
```
$ npm install --save @bouncingpixel/mongoose-acl

$ yarn add @bouncingpixel/mongoose-acl
```

### Using mongoose-acl

The plugin requires an options object with the four required functions: `canCreate`, `canRead`, `canUpdate`, and `canDelete`.
Each function is called with `this` context set to the Model.

In general, the return of each function can be a boolean or the fields which the user may access or manipulate. When referring to a create or update action, the term `access` will also mean `ability to set or alter`.

- If the return is falsey (`false`, `null`, `undefined`), then no access is allowed.
- If the return is exactly true, all access is allowed.
- If the return is an array of field names, then only those fields can be accessed.
- If the return is an object with the key allow set to an array of field names, then only those fields can be accessed.
- If the return is an object with the key disallow set to an array of field names, then all other fields except these can be accessed.
- If the return is an object with both keys allow and disallow set to arrays of field names, then any item within disallow is removed from allow, and the resulting set is the fields which may be accessed.
- In the event an empty array is specified, then the user has no access.

There are two deviations from these rules:

- `canRead` also allows a `query` key in the returned object. This key must be a function which receives one parameter, the query from Mongoose. This allows the ACL rule to automatically add to the query to enhance security.

- `canDelete` is only a true or false situation. You cannot delete some fields and not others. Any falsey value (`false`, `null`, `undefined`) will prevent the deletion. Any non-falsey value, including an array whether empty or non-empty, **will be assumed to be true** and allow the delete to continue.

```ts
canCreate(req: Request, document: MongooseDocument<Model>): RuleSpec
canRead(req: Request, query: MongooseQuery): ReadRuleSpec
canUpdate(req: Request, document: MongooseDocument<Model>): RuleSpec
canDelete(req: Request, document: MongooseDocument<Model>): DeleteRuleSpec
```

The rules will be enforced using hooks, thus it is possible to bypass a security rule by ignoring hooks for a specific action.
**Note**: At this time, there are some functions which do not cause hooks to be called. For example, `Model.remove` in Mongoose does not call the `remove` hook.

The `canCreate` and `canUpdate` rely on the pre-validation hook. For the use case where a rule limits which fields a user may access, but the system should auto-generate values for the field, one may use a pre-validation or a pre-save hook that must be added to the Schema after the plugin. If you require your pre-validation hook to perform actions that must also be ACL protected, then define your pre-validation hook before the plugin is added.

By default, the hooks will not permit any action which generates hooks until a protected instance of the model is created. To create a protected instance, you must pass in a `request` object, which can actually be any object which will be passed to the rule definitions to test the access level of a request.

A static method on the Model, `.protect(req)` exists to generate a protected instance. In the current version, protect **will modify** the req object to set `req.protectedModels` and uses that as a cache for all protected models. Calling `.protect(req)` with the same req object multiple times will use the cached protected-model, unless req cannot be modified.

#### Express Middlewares

There are also a number of Express middleware which can optionally be utilized.

The protect method is also a middleware, `.protect(req, res, next)`, and can mounted to automatically add a protected model to the `req` object.

##### Read middlewares

`makeReadMany(options)` and `makeReadOne(options)` will create a middleware for reading. The two are separate middlewares as fetching a list and fetching a single instance are different actions and generally are attached to different routes.

`makeReadOne(options)` can make use of `req.params.id` to read one document based on the ObjectID. Otherwise, this may use the same where, sort, and offset. Any limits set will be ignored and only one document will be returned.

All options are optional. The options which can be passed in are as follows:
```ts
initialWhere: any // the where clause which is appended to any specified by the used
initialSort: any // the sort clause which is appended to any specified by the used

initialLimit: Number // the default limit to use
initialOffset: Number // the default offset to use

// all of the next ones default to false
canExtendWhere: Boolean // if the user may use req.query.where to set the query
canExtendSort: Boolean // if the user may use req.query.sort to set the sort
canSetLimit: Boolean // if the user may set req.query.limit to set the limit
canSetOffset: Boolean // if the user may set req.query.offset to set the offset

resLocalsField: String // what field to set the data to in res.locals, defaults to data
```

##### Create middleware

`makeCreate(options)` creates the middleware for document creation. The middleware expects the data to use for creation will be in `req.body[incomingDataField]` where `incomingDataField` is either the option set or the model name used when creating the model: `mongoose.model('modelName', MySchema)`.

All options are optional. The options which can be passed in are as follows:
```ts
resLocalsField: String // what field to set the data to in res.locals, defaults to data

incomingDataField: String // what field in req.body the updated data will be in
```

If the model defines an static method `deserializeForm(originalDocument?)`, that function will be used to manipulate the data at `req.body[incomingDataField]`. There is no originalDocument for create, unlike update. The function can return a Promise or run synchronously. The middleware will expect `req.body[incomingDataField]` to contain the final data used to perform the create.

##### Update middlewares

`makeUpdate(options)` creates the middleware for document updates based on ID. The middleware expects the `_id` of the item to be updated to be in `req.params.id`. The middleware expects the data to use for creation will be in `req.body[incomingDataField]` where `incomingDataField` is either the option set or the model name used when creating the model: `mongoose.model('modelName', MySchema)`.

The default updater currently uses a shallow merge method. Any field not defined or set to undefined will not be merged, thus keeping the original value. Any objects or arrays will be set as-is and will not be merged with their counterparts in the document. The updater can be changed with the option `mergeUpdates`.

If the model defines an static method `deserializeForm(originalDocument?)`, that function will be used to manipulate the data at `req.body[incomingDataField]`. The original document before updates is provided. The function can return a Promise or run synchronously. The middleware will expect `req.body[incomingDataField]` to contain the final data used to perform the update. When using the default updater, this function can set fields to undefined in order to preserve the original value.

All options are optional. The options which can be passed in are as follows:
```ts
mergeUpdates(document: MongooseDocument<Model>, updates: any, req: Request): Promise?

resLocalsField: String // what field to set the data to in res.locals, defaults to data

incomingDataField: String // what field in req.body the updated data will be in
```

##### Delete middlewares

`makeDelete(options)` creates the middleware for deleting documents by ID. The middleware expects the `_id` of the item to be deleted to be in `req.params.id`. The only option available is `resLocalsField` which defines the field in `res.locals` that will contain the deleted instance.
