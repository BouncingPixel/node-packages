'use strict';

const NotAuthorizedError = require('@bouncingpixel/http-errors').NotAuthorizedError;
const ForbiddenError = require('@bouncingpixel/http-errors').ForbiddenError;

module.exports = function(impl) {
  return function(roleName) {
    return function(req, res, next) {
      if (!req.user) {
        next(new NotAuthorizedError('You must be logged in to access this page'));
        return;
      }

      if (!impl.isUserRoleAtleast(req.user, roleName)) {
        next(new ForbiddenError('You do not have permission to access this page'));
        return;
      }

      next();
    };
  };
};
