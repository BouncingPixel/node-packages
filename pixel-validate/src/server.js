const mongooseDocument = require('mongoose/lib/browserDocument');
mongooseDocument.emit = function() {};

const validateFactories = require('./validate');
const validateAll = validateFactories.validateAllFactory(mongooseDocument);
const validateField = validateFactories.validateFieldFactory(mongooseDocument);

exports.validate = validateAll;
exports.validateField = validateField;

exports.ValidateMiddlware = function(Schema, redirectto) {
  return function(req, res, next) {
    const data = req.body;

    validateAll(data, Schema).then(function() {
      next();
    }).catch(function(err) {
      if (!err.errors) {
        next(err);
        return;
      }

      const errors = err.errors;

      if (req.xhr || (req.accepts('html', 'json') === 'json')) {
        const message = Object.keys(errors).map((prop) => {
          const errorInfo = errors[prop];
          return errorInfo.message;
        }).join(', ');

        res.status(400).send(message);
        return;
      }

      Object.keys(errors).forEach((prop) => {
        const errorInfo = errors[prop];
        const message = errorInfo.message;

        req.flash('error', message);
      });

      if (!redirectto) {
        res.redirect(req.path);
      } else if (redirectto instanceof Function) {
        redirectto(req, res);
      } else {
        res.redirect(redirectto);
      }
    });
  };
};
