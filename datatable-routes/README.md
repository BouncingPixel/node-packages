# datatable-routes

Route handlers for working with Datatables.NET.
Currently only a Mongoose model route handler exists.

## Working With

### Requirements

- NodeJS 6 LTS
- A supported implementation for the desired database

### Using datatable-routes

Datatable integration is provided through the utility: `@bouncingpixel/datatables-routes`.
This utility exposes different implementations for different databases.
For example, when using Mongoose, use the `.mongoose` controller.

The mongoose controller contains one factory method which generates a route handler for a specific model.
Just pass a reference to the desired model.
Searching, pagination, sorting, and fetching only the necessary data is built in.

Example:

```js
const DatatableHandler = require('@bouncingpixel/datatables-routes').mongoose;

router.get('/tabledata', DatatableHandler.makeHandler(UserModel));
```
