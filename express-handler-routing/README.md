# express-handler-routing

Generates routes for Express based on the file structure of route files.

## Working With

### Requirements

- NodeJS 6 LTS
- Express

### Using express-handler-routing

To use the package, simply require it in and pass in the path to your routes directory.

Subdirectories will be navigated properly.
To create a route for a directory, create an index.js file in that directory.
This route will work with and without the ending slash.

```js
app.use(
  require('@bouncingpixel/express-handler-routing')(
    path.resolve(process.cwd(), 'server/routes/'), // path to the routes directory
  )
);
```

Each route file contains the method and handlers for the method. Route files may also contain nested routes to help group similar routes together in a single file. For example, if we have a file at the path `/_site/blogs.js` which contains the following route definition:

```js
module.exports = {
  get: {
    // handler is a standard Express handler for a route.
    handler: function(req, res) {
      Blogs
        .find({})
        .then((posts) => {
          res.render('blogpost-list', posts);
        });
    },
  },

  // could define the other methods, post, put, etc

  // a nested route for a specific blog post
  '/:id': {
    get: {
      // pre is a set of middleware to run before handler
      pre: [isIdParamValid],

      handler: function(req, res, next) {
        Blogs
          .findOne({_id: req.param.id})
          .then((post) => {
            if (!post) {
              next(new NotFoundError('Could not find the blog post'));
            } else {
              res.render('blogpost', post);
            }
          });
      },

      // post will run after handler if next() is called
      // can be useful for error handling or further processing
      post: [blogNotFoundHandler]
    }
  }
};
```

The following routes will be generated:
```
/:site/blogs
/:site/blogs/:id
```
