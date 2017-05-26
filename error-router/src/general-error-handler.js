'use strict';

const logger = require('winston');
const http = require('http');
const fs = require('fs');
const path = require('path');

function _determineLogMessage(data, defaultMessage) {
  if (!data) {
    return defaultMessage;
  } else if (data instanceof Error) {
    return data.message || defaultMessage;
  } else {
    return data.toString();
  }
}

module.exports = function makeErrorHandler(inoptions) {
  const options = inoptions || {};
  if (options.enableFlash == null) {
    options.enableFlash = true;
  }
  if (options.response401Json == null) {
    options.response401Json = 'You must be logged in';
  }
  if (options.redirectOn401 == null) {
    options.redirectOn401 = '/';
  }

  return function generalErrorHandler(err, req, res, _next) {
    const statusCode = err.status || 500;
    res.status(statusCode);

    if (statusCode === 401) {
      if (req.xhr || req.wantsJSON) {
        return res.send(options.response401Json);
      }

      if (options.sessionRedirectVar) {
        req.session[options.sessionRedirectVar] = req.path;
      }

      return res.redirect(options.redirectOn401);
    }

    const defaultMessage = http.STATUS_CODES[statusCode] || http.STATUS_CODES[500];

    // check if the view file exists and use that
    // if not, check if view.substring(0, end-2) + 'xx' exists and use that
    // if not, then check if error/error.dust exists and use that
    // if not, then just send the message

    const logMessage = _determineLogMessage(err, defaultMessage);

    // log everything that is not a 401, 403, or 404 error
    if ([401, 403, 404].indexOf(statusCode) === -1) {
      logger.warn(logMessage);
      logger.warn(err);
    } else if (statusCode !== 404) {
      // info the non-404s just in case
      logger.debug(logMessage);
      logger.debug(err);
    } else {
      // 404s are really just silly in reality, but here just in case
      logger.silly(logMessage);
      logger.silly(err);
    }

    if (req.xhr || req.wantsJSON) {
      return res.send(logMessage);
    }

    if (req.method.toLowerCase() === 'post') {
      if (options.enableFlash) {
        req.flash('error', logMessage);
      }

      let redirectTo = err.redirectTo || req.url;
      res.redirect(redirectTo);

      return;
    }

    // take the URL, ignoring the first slash
    // split it into parts
    // ignore the last part and focus on just the directories
    // keep popping dirs off until you get to /
    // so a 503 on /blog/blah would try:
    //   - views/blog/errors/503.dust
    //   - views/blog/errors/5xx.dust
    //   - views/errors/503.dust
    //   - views/errors/5xx.dust

    const statusCodePage = `errors/${statusCode}`;
    const codeGroupPage = statusCodePage.substr(0, statusCodePage.length - 2) + 'xx';
    let possibleViews = err.showView ? [err.showView] : [];

    const url = req.path.replace(/\/{2,}/g, '/').substring(1);

    let slashIndex = url.lastIndexOf('/');
    while (slashIndex !== -1) {
      let pathpart = url.substring(0, slashIndex + 1);
      possibleViews.push(pathpart + statusCodePage);
      possibleViews.push(pathpart + codeGroupPage);
      possibleViews.push(pathpart + 'errors/error');

      slashIndex = url.lastIndexOf('/', slashIndex - 1);
    }
    // now add the ones for the "root" part
    possibleViews.push(statusCodePage);
    possibleViews.push(codeGroupPage);
    possibleViews.push('errors/error');

    const viewsDirPath = path.resolve(req.app.get('views'));
    const viewsExt = req.app.get('view engine');

    findExistingErrorPage(viewsDirPath, viewsExt, possibleViews, function(_err, view) {
      if (!view) {
        res.send(logMessage);
        return;
      }

      res.render(view, {
        status: statusCode,
        defaultMessage: defaultMessage,
        message: logMessage,
        error: err
      });
    });

  };

  // never returns errors, because we are trying to handle an error anyway
  // will default to returning no page (undefined) if all possibleViews encounter errors
  function findExistingErrorPage(viewsDirPath, viewsExt, possibleViews, done) {
    if (possibleViews.length) {
      const view = possibleViews.shift();
      const viewPath = path.resolve(viewsDirPath, [view, viewsExt].join('.'));

      fs.access(viewPath, fs.constants.R_OK, (err) => {
        if (err) {
          // if cannot access that one, then try the next one
          findExistingErrorPage(viewsDirPath, viewsExt, possibleViews, done);
          return;
        }

        done(null, view);
      });
      return;
    }

    // nothing found
    done();
  }
};
