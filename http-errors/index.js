module.exports = {
  HttpError: require('./dist/index').HttpError,

  AccountLockedError: require('./dist/accountlocked').AccountLockedError,
  BadRequestError: require('./dist/badrequest').BadRequestError,
  BannedError: require('./dist/banned').BannedError,
  ForbiddenError: require('./dist/forbidden').ForbiddenError,
  InternalServerError: require('./dist/internalserver').InternalServerError,
  NotAuthorizedError: require('./dist/notauthorized').NotAuthorizedError,
  NotFoundError: require('./dist/notfound').NotFoundError
};
