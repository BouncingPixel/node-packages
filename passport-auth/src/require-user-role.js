'use strict';

const nconf = require('nconf');
const NotAuthorizedError = require('@bouncingpixel/http-errors').NotAuthorizedError;
const ForbiddenError = require('@bouncingpixel/http-errors').ForbiddenError;

const authImpl = nconf.get('provider:passportAuthImpl');

module.exports = function(roleName) {
  return function(req, res, next) {
    if (!req.user) {
      next(new NotAuthorizedError('You must be logged in to access this page'));
      return;
    }

    if (!authImpl.isUserRoleAtleast(req.user, roleName)) {
      next(new ForbiddenError('You do not have permission to access this page'));
      return;
    }

    next();
  };
};
