# auto-static-routes

Automatically generates Express routes for Dust files within a directory.

## Working With

### Requirements

- NodeJS 6 LTS
- Express

### Using auto-static-routes

This package has two modes, development and production.

In development, the package will search for the file to use on every request.
This allows developers to add, remove, and change files on the fly without restarting.

In production, the routes are determined at load time and cannot change.

To use the package, simply require it in and pass in the directory to your views folder
along with the folder name containing the pages to generate routes for.

Subdirectories will be navigated properly.
To create a route for a directory, create an index.dust file in that directory.
This route will work with and without the ending slash in both production and development.
This is to match the behavior of express which does not require the ending slash.

```js
app.use(
  require('@bouncingpixel/auto-static-routes')(
    path.resolve(process.cwd(), app.get('views')),
    'pages'
  )
);
```
