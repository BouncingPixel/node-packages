module.exports = {
  HttpError: require('./dist/index'),

  AccountLockedError: require('./dist/accountlocked'),
  BadRequestError: require('./dist/badrequest'),
  BannedError: require('./dist/banned'),
  ForbiddenError: require('./dist/forbidden'),
  InternalServerError: require('./dist/internalserver'),
  NotAuthorizedError: require('./dist/notauthorized'),
  NotFoundError: require('./dist/notfound')
};
