# express-view-routing

Automatically generates Express routes for view files within the views directory.

## Working With

### Requirements

- NodeJS 6 LTS
- Express

### Using express-view-routing

This package has two modes, development and production.

In development, the package will search for the file to use on every request.
This allows developers to add, remove, and change files on the fly without restarting.

In production, the routes are determined at load time and cannot change.

To use the package, simply require it in and pass in the directory to your views folder, the folder name containing the pages to generate routes for, and the file extension of your view files.

Subdirectories will be navigated properly.
To create a route for a directory, create an index.dust (if dust is your extension) file in that directory.
This route will work with and without the ending slash in both production and development.
This is to match the behavior of express which does not require the ending slash.

```js
app.use(
  require('@bouncingpixel/express-view-routing')(
    path.resolve(process.cwd(), app.get('views')), // path to the views directory
    'pages', // folder within the views directory for the pages to generate routes
    app.get('view engine') // the extension of view files
  )
);
```

#### Path parameters

Path parameters can be added as a route component by using an underscore before the path name.
For example, given the following directory tree and assuming `.dust` is our file extension:

```
views/pages/
├─┬ dashboard/
│ └── index.dust
├─┬ blogs/
│ ├── index.dust
│ └── _post.dust
├── index.dust
└── login.dust
```

The following routes will be generated:
```
/
/dashboard
/blogs
/blogs/:post
/login
```
