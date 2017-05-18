'use strict';

const NotAuthorizedError = require('@bouncingpixel/http-errors').NotAuthorizedError;

module.exports = function(req, res, next) {
  if (!req.user) {
    next(new NotAuthorizedError('You must be logged in to access this page'));
    return;
  }

  next();
};
