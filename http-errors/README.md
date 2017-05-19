# http-errors

A set of Error classes which contain a status set for handling errors in Express.

## Working With

### Requirements

- NodeJS 6 LTS

### Using http-errors

The following Error classes exist with the status set:

| Error                 | Status |
|-----------------------|:------:|
| BadRequestError       |  400   |
| NotAuthorizedError    |  401   |
| BannedError           |  402   |
| ForbiddenError        |  403   |
| NotFoundError         |  404   |
| AccountLockedError    |  429   |
| InternalServerError   |  500   |

To raise one of these errors, first require in the `@bouncingpixel/http-errors` package, then just use like any other Error
- call `next`, for example: `next(new HttpErrors.BadRequestError('My Error Message'));`
- or throw the error, for example `throw new HttpErrors.BadRequestError('My Error Message');`
- or use in a callback, for example `done(new HttpErrors.BadRequestError('My Error Message'));`
- or any other use of an Error object
