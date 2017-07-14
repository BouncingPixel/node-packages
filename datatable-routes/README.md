# datatable-routes

Route handlers for working with Datatables.NET.
Currently only a Mongoose model route handler exists.

## Working With

### Requirements

- NodeJS 6 LTS
- A supported implementation for the desired database
  - Mongoose
  - Massive JS (Postgres)

### Using datatable-routes

Datatable integration is provided through the utility: `@bouncingpixel/datatables-routes`.
This utility exposes different implementations for different databases.
For example, when using Mongoose, use the `.mongoose` controller.

#### Mongoose

The mongoose controller contains one factory method which generates a route handler for a specific model.
Just pass a reference to the desired model and any additional options.
Searching, pagination, sorting, and fetching only the necessary data is built in.

Example:

```js
const DatatableHandler = require('@bouncingpixel/datatables-routes').mongoose;

const options = {
  extraCols: ['col1', 'col2'], // extra columns to select, could be true to select all columns
  baseQuery: {}, // the base query to always use, including for the total, "unfiltered" count
  allowExtraFilter: true, // true or false if the browser can add extra filters
  extraQuery: {} // additional filters to be added after the browser-filters. does overwrite browser-filters
};

router.get('/tabledata', DatatableHandler.makeHandler(UserModel, options));
```

#### Massive JS

The Massive controller contains one factory method which generates a route handler for a specific table.
Just pass the name of the table or view along with any additional options.
Searching, pagination, sorting, and fetching only the necessary data is built in.

```js
const DatatableHandler = require('@bouncingpixel/datatables-routes').massive;

router.get('/tabledata', DatatableHandler.makeHandler('users', options));
```
