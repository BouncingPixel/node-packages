import { HttpError } from './index';

export class NotAuthorizedError extends HttpError {
    constructor(message?: string) {
        super(message || 'You may need to login to access that', 401);
    }
}
