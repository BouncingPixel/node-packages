# mailgun-emails

A utility for sending emails using SMTP (through NodeMailer).
This package is very similar to the mailgun-emails, but using SMTP instead of Mailgun.
Emails are defined in a directory with a `.dust` template file and a `.js` settings file.

## Working With the Template

### Requirements

- NodeJS 6 LTS
- dustjs-linkedin pre-initialized
- An SMTP account with known host, port, is secure, username, and password

### Configuration

This module, like many other `@bouncingpixel` modules, relies on nconf.
The following configuration keys should be defined to use this module:

#### Required
- `smtpmailTemplatePath`
  The path to the directory containing the template dust and JS settings files.
- `smtpmailHost`
  The host of the SMTP server.
- `smtpmailPort`
  The port of the SMTP server.
- `smtpmailSecure`
  True or false if the SMTP server requires secure.
- `smtpmailUser`
  The username to connect to the SMTP server.
- `smtpmailPass`
  The password to connect to the SMTP server.

#### Optional
- `smtpmailDefaultFrom`
  The default address to use in the From field when an email does not have a specific one defined.
- `siterootHost`
  The site's root host such as `mydomain.com` for URLs rendered by Dust. The resulting URL is defined as `siterootUrl`
- `requireHTTPS`
  If `siterootUrl` is defined, this defines if any URLs sent to the user should be HTTP or HTTPS

### Using mailgun-emails

The email folder is used to store the configuration and dust template files for each email that could be sent.
An email type must contain both files: a JS file which exports an object containing the configuration for that email,
and a dust file defining the template to be displayed to the end user. For mass-sent emails that need individual variables,
Mailgun supports per-recipient variables. Expose the variable in the configuration using `individualVars`, and then
use the format `%recipient.VARIABLE%` where `VARIABLE` is the name of the variable exposed. All variables shared between
all recipients can skip the Mailgun template variables and use Dust directly. These variables are exposed with `dustVars`.

Each email can define who the from address is. This can either be a function which returns the from address or a string.
Each email can define who the to addresses are. This field is an array and can either contain a string of each email or
an object such as `{name: "Person's name", email: "email@address.domain"}`.
Finally, the email configuration must define a subject, which may be a function or a string.

Each of the functions defined for `to`, `from`, `subject`, `individualVars`, and `dustVars` take only one parameter
which contains all options passed into the call to `sendTemplateEmail`.

Sending an email uses the function `sendTemplateEmail`. This function returns a promise.

```ts
// Sends an email
sendTemplateEmail(options: {
  // template, required
  // the name of the template to load. This is the filename of the .dust/.js file.
  template: string,

  // recipients, required unless template settings defines `to`
  recipients: string[] | {name: string, email: string}[],

  // any additional parameters needed for processing may be passed
}): Promise
```

### Creating a template

A template consists of two parts: a dust template and a JS settings file.
The dust file is just normal dust and any helpers that are attached to the dust JS.

The settings file is a single exported object.
The settings file is as follows:
```js
module.exports = {
  // from is optional if mailgunDefaultFrom is defined. will always use this as from if available.
  // this can optionally be a function that takes a single parameter: the options passed to sendTemplateEmail
  from: 'Our Site <noreply@oursite.com>',

  // to is optional if the recipients is defined in the sendTemplateEmail options parameter
  // this can optionally be a function that takes a single parameter: the options passed to sendTemplateEmail
  to: ['whogetsit@oursite.com'],

  // the subject of the email to send, this is required
  // this can optionally be a function that takes a single parameter: the options passed to sendTemplateEmail
  subject: 'My email subject',

  // dustVars is an optional function to filter or manipulate the options to generate variables exposed to dust
  // by default, all options passed to sendTemplateEmail if this is not defined
  dustVars: function(options) {
    return options;
  },

  // individualVars is an optional function to determine which values each recipient recieves
  // this uses Mailgun's templates, not the dustjs!
  individualVars: function(recipient, opts) {
    return null;
  }
};
```
