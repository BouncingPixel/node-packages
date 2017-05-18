import { HttpError } from './index';

export class ForbiddenError extends HttpError {
    constructor(message?: string) {
        super(message || 'You do not have permission to access that', 403);
    }
}
