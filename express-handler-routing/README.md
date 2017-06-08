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

Each route file exports one object with the method and handlers for the method. Route files may also contain nested routes to help group similar routes together in a single file. The object keys can be the HTTP method (`get`, `post`, `head`, etc) which will be mounted as a route, `use` which will mount middleware or an array of middlewares at that route, or a string starting with a forward slash to denote a nested route.

The HTTP method must point to an object which contains at least a key `handler` pointing to an Express route handler of `function(req, res)` or `function(req, res, next)`. Optionally, this object may also contain `pre` and `post` middlewares.

The routing object may also contain `pre` and `post` middleware that is applied to all routes contained within the route file. The `pre` and `post` can be defined at any level, including nested routes. `pre` will run in order down the chain to the `handler`, then the `post` will run back up the chain away from the `handler`.

For example, if we have a file at the path `/_site/blogs.js` which contains the following route definition:

```js
module.exports = {
  // pre-middleware to run before all routes in this file
  pre: [
    isLoggedInUser,
    getLatestPosts
  ],

  // can also do some post middlewares as well
  post: [],

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
