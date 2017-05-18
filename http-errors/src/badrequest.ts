import { HttpError } from './index';

export class BadRequestError extends HttpError {
    constructor(message?: string) {
        super(message || 'Your request did not contain the necessary information', 400);
    }
}
