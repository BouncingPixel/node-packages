'use strict';

const path = require('path');
const nconf = require('nconf');
const dust = require('dustjs-linkedin');
const logger = require('winston');
const fs = require('fs');

const emailTemplatesPath = path.resolve(nconf.get('mailgunTemplatePath'));
const defaultFrom = nconf.get('mailgunDefaultFrom');
const siterootHost = nconf.get('siterootHost');
const requireHTTPS = nconf.get('requireHTTPS');

const siterootUrl =
  (requireHTTPS && requireHTTPS.toString().toLowerCase() === 'true' ? 'https' : 'http') +
  '://' + siterootHost;

const mailgunDomain = nconf.get('mailgunDomain');
const mailgun = (mailgunDomain && nconf.get('mailgunApiKey')) ?
    require('mailgun-js')({apiKey: nconf.get('mailgunApiKey'), domain: mailgunDomain}) :
    null;

// using own cache and loader in case none was loaded. also, doesn't overwrite another loader
const dustTemplateCache = {};

function loadTemplate(templateName) {
  if (dustTemplateCache[templateName]) {
    return Promise.resolve(dustTemplateCache[templateName]);
  }

  const filepath = path.resolve(emailTemplatesPath, templateName + '.dust');

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, { encoding: 'utf8' }, function(err, data) {
      if (err) {
        reject(err);
        return;
      }

      const compiledTemplate = dust.compile(data);
      const tmpl = dust.loadSource(compiledTemplate);

      dustTemplateCache[templateName] = tmpl;

      resolve(tmpl);
    });
  });
}

function dustRender(templatePath, context) {
  return new Promise((resolve, reject) => {
    dust.render(templatePath, context, function(err, content) {
      if (err) {
        reject(err);
        return;
      }

      resolve(content);
    });
  });
}

function formatEmailAddress(person) {
  if (typeof person === 'string') {
    return person;
  }
  return `${person.name} <${person.email}>`;
}

function getValue(item, opts) {
  if (!item) {
    return null;
  }

  if (item instanceof Function) {
    return item(opts);
  }

  return item;
}

let templateCache = {};

module.exports = {

  /*
   * options must have:
   * - template: String
   * - recipients: [User] optional if the template pre-defines the To field
   * - *: really anything that is needed for the template
   */
  sendTemplateEmail: function(opts) {
    if (!opts) {
      return Promise.reject('No options were sent');
    }

    if (!mailgun) {
      logger.info('Mailgun is not configured, ignoring email request');
      return Promise.resolve();
    }

    const templateName = opts.template;

    if (!templateCache[templateName]) {
      templateCache[templateName] = require(path.resolve(emailTemplatesPath, templateName));
    }
    const template = templateCache[templateName];

    if (!template) {
      return Promise.reject(`Template '${templateName}' was not found`);
    }

    // get everyone defined in the .to of the template and concat with any extra recipients listed in the options
    const recipients = (getValue(template.to, opts) || []).concat(
      (opts.recipients || []).filter(function(person) {
        if (typeof person === 'string') {
          return true;
        }

        return !(person.emailOptOut && (person.emailOptOut === true || person.emailOptOut[templateName]));
      }));

    if (!recipients.length) {
      logger.info('No recipients to send to, ignoring email request');
      return Promise.resolve();
    }

    const toEmails = recipients.map(formatEmailAddress);

    const fromEmail = getValue(template.from, opts) || defaultFrom;
    if (!fromEmail || !fromEmail.length) {
      return Promise.reject('No from email');
    }

    const individualVars = template.individualVars ? recipients.reduce(function(obj, recipient) {
      const mailgunVars = template.individualVars(recipient, opts);
      if (mailgunVars) {
        if (!obj) {
          obj = {};
        }
        obj[recipient.email] = mailgunVars;
      }
      return obj;
    }, null) : null;

    const subject = getValue(template.subject, opts);

    if (!subject || !subject.length) {
      return Promise.reject('No subject or subject is empty for email');
    }

    let locals = template.dustVars ? template.dustVars(opts) : opts;
    locals.siterootUrl = siterootUrl;

    const renderOptions = {
      view: null,
      views: emailTemplatesPath,
      name: templateName,
      ext: '.dust',
      locals: locals
    };
    const context = dust.context({}, renderOptions).push(locals);

    return loadTemplate(templateName).then(function(tmpl) {
      return dustRender(tmpl, context);
    }).then(function(htmlContent) {
      if (!htmlContent || !htmlContent.length) {
        throw new Error('No content to send');
      }

      const dataToSend = {
        from: fromEmail,
        to: toEmails,
        subject: subject,
        html: htmlContent
      };

      if (individualVars) {
        dataToSend['recipient-variables'] = individualVars;
      }

      return mailgun.messages().send(dataToSend);
    });
  }

};
