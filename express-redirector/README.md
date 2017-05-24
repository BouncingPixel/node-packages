# express-redirector

A utility for generating 301 or 302 redirects.

## Working With

### Requirements

- NodeJS 6 LTS

### Using express-redirector

Create a mapping of old URLs to new URLs.
The old URLs use `express` route syntax, so they can contain `:parameter`.
The new URL side can either be a string with the URL or an object containing `path` and optionally `status`.
`status` may be used to specify the exact redirect status code to use, defaulting to 302.
The path can use ES6-like templates to reference `:parameter`.

```js
const oldToNewRedirects = {
  '/about': {
    path: '/about-us',
    status: 301
  },
  '/page/:pgnum': '/?page=${pgnum}',
  '/posts/page/:pagenum': '/blog',
  '/category/:category': '/blog/tag/${category}',
  '/category/:category/page/:pgnum/': '/blog/tag/${category}?page=${pgnum}',
  '/wp-content/uploads/:year/:month/:image': 'https://images,outsite.com/blog/${image}',
};
require('@bouncingpixel/express-redirector')(app, oldToNewRedirects)
```
