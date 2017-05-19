# universal-response

Exposes a set of `OK` universal responses for working with XHR and non-XHR clients.

## Working With

### Requirements

- NodeJS 0.10+
- Express 4+

### Using universal-response

Add the main middleware to expose the functions on the `res` object.
```js
app.use(require('@bouncingpixel/universal-response'));
```

The following response utilities are added:

```ts
  // defined if req.xhr or if the req only accepts json
  req.wantsJSON: boolean

  // ok will either render the view if the request is not XHR nor wants JSON
  // or will send the data as JSON for XHR/wants JSON requests
  res.ok(view: string, data: any)

  // ok will either redirect to a page if the request is not XHR nor wants JSON
  // or will send the data as JSON for XHR/wants JSON requests
  res.okRedirect(page: string, data: any)
```
