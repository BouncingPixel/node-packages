# nocaptcha-middleware

An express middleware to validate a nocaptcha response

## Working With

### Requirements

- NodeJS 6 LTS

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `nocaptchaSecret`
  The secret, or API key, to use with nocaptcha validation. If not set, the captcha will be bypassed (always pass).

#### Optional
- `nocaptchaBypass`
  True or false (boolean) to bypass the captcha. Useful for local environments without the need for captcha during testing.

### Using nocaptcha-middleware

Include in an Express route or `.use` function like any other middleware.
