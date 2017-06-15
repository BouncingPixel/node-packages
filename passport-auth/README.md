# passport-auth

Wrapper around passport to automatically configure email+password, email+token, and optional oauth.
The wrapper also generates a new session for logins unlike Passport's default behavior.
This wrapper also provides a number of Express middlewares.
The database calls are abstracted in order to support different databases.

## Working With

### Requirements

- NodeJS 6 LTS
- A database adapter with a `passport impl` that implements necessary functions

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `provider:passportAuthImpl`
  A module that will be used as the `impl` (see schema at bottom for more information)
- `maxFailTries`
  The maximum number of failed login attempts before locking an account. Defaults to `3`.
- `maxLockTime`
  The maximum length of time an account may be locked out. Defaults to `1 hour`.
- `siterootHost`
  The domain of the site, used in canonical URLs and emails sent out, but can be used in other places with redirects.
- `requireHTTPS`
  Set to true if the site should use HTTPS in all URLs (such as canonical). Defaults to `false`.

#### Optional
- `auth:enablerememberme`
  A true or false (defaults false) if the remember-me functionality should be enabled.

For Facebook:
  - `sso:facebook:appid`
    The app ID to use for Facebook oauth integration
  - `sso:facebook:secret`
    The secret for Facebook oauth integration

For Google:
  - `sso:google:clientid`
    The app ID to use for Google oauth integration
  - `sso:google:secret`
    The secret for Google oauth integration

For Twitter:
  - `sso:twitter:key`
    The app ID to use for Twitter oauth integration
  - `sso:twitter:secret`
    The secret for Twitter oauth integration

For LinkedIn:
  - `sso:linkedin:key`
    The app ID to use for LinkedIn oauth integration
  - `sso:linkedin:secret`
    The secret for LinkedIn oauth integration

### Using passport-auth

The module requires a `passport-auth-impl` to function (see bottom for schema).
Be sure to set the provider in the nconf key `provider:passportAuthImpl`.

The following middleware are available for use:
```js
// issues a Rememberme token to the user
passportAuth.middlewares.issueRememberMe

// performs a standard email+password login using req.body.email and req.body.password
passportAuth.middlewares.login

// performs a standard email+token login using req.body.email and req.body.token
// used for forgotton password, password-less, etc.
passportAuth.middlewares.tokenLogin

// log out of any logged in account
passportAuth.middlewares.logout

// continues only if a user account is logged in
// otherwise sends a 401 error to be handled by an error handler
passportAuth.middlewares.requireLoggedIn

// continues only if a user account is not logged in
// otherwise redirects to '/'
passportAuth.middlewares.requireLoggedOut

// continues only if the user's role is at least a certain level
// the behavior is defined by the passport-impl's isUserRoleAtleast
passportAuth.middlewares.requireUserRole


// the following middleware only exist when configured
// the start methods are the beginning of the oauth cycle
// the callback methods are for the callbacks from the oauth sources

passportAuth.middlewares.facebookStart
passportAuth.middlewares.facebookCallback

passportAuth.middlewares.googleStart
passportAuth.middlewares.googleCallback

passportAuth.middlewares.twitterStart
passportAuth.middlewares.twitterCallback

passportAuth.middlewares.linkedinStart
passportAuth.middlewares.linkedinCallback
```

#### passport-impl schema

The `passport-impl` must be an object with the following methods:
```ts
type Token = string;
type UserId = string;

{
  serializeUser(user: {_id: any, ...}): string

  deserializeUser(serializedUserString: string, req: Express.Request): Promise<User>

  findUserById(id: UserId): Promise<User?>

  findUserWithEmailIn(emails: string[]): Promise<User?>

  findUserBySSO(provider: string, id: string): Promise<User?>

  findUserForLogin(lowerCaseEmail: string): Promise<User?>

  findUserForToken(lowerCaseEmail: string): Promise<User?>

  findLockoutInfo(lowerCaseEmail: string): Promise<LoginLocker?>

  successLogin(user: User, lockout: LoginLocker): Promise

  failedLogin(user: User, lowerCaseEmail: string, lockout: LoginLocker): Promise

  successTokenLogin(user, lockout): Promise

  consumeRememberMe(token: Token): Promise<UserId>

  generateRememberMe(userid: UserId): Promise<Token>

  associateUserForSSO(user: User, profile: any): Promise

  createUserForSSO(profile: any): User

  isUserRoleAtleast(user: User, desiredRole: string): boolean
}
```

#### Current impls:

[@bouncingpixel/mongoose-passport-impl](https://github.com/BouncingPixel/node-packages/tree/master/mongoose-passport-impl)
