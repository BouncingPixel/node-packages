'use strict';

const path = require('path');
const nconf = require('nconf');
const dust = require('dustjs-linkedin');
const logger = require('winston');

const emailTemplatesPath = path.resolve(nconf('mailgunTemplatePath'));
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
      logger.info('No recipients to send to, ignoring email request');
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

    return new Promise(function(resolve, reject) {
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
      const templatePath = path.resolve(__dirname, '..', 'emails', templateName);
      dust.render(templatePath, context, function(err, htmlContent) {
        if (err) {
          reject(err);
        } else {
          resolve(htmlContent);
        }
      });
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
