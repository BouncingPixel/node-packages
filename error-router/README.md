# error-router

An Express handler for handling errors and determining the view to show to the user.

## Working With

### Requirements

- NodeJS 6 LTS

### Using error-router

The general error handler will either send a message via JSON for AJAX calls or it will render an error page.
Errors can have a custom field, status, which defines which HTTP status code to use for that error.
If the status is not defined, a 500 status is assumed.

Suggest using [Http-Errors](https://github.com/BouncingPixel/node-packages/tree/master/http-errors) to preset status.

Alternatively, when using Error, `status` may be set along with `showView` to define the specific template.

When the generic error handler is rendering a page, it may use fallback pages if the specified page does not exist.
The order the error handler will try is defined by:

- The template set in `showView` if set on the Error object
- Templates within any subdirectories up to the root views directory for:
  - A template based on the status code
  - A template based on the status code class (ex all 400-499 fall back to 4xx and 500-599 fall back to 5xx)
  - A generic template used to catch all
- Just rendering the string out

Example code: 503 with `showView` set to "errors/oops" with the URL "blog/this-is-a-post"
- errors/oops.dust
- blog/errors/503.dust
- blog/errors/5xx.dust
- blog/errors/error.dust
- errors/503.dust
- errors/5xx.dust
- errors/error.dust
- No template, just send the string
