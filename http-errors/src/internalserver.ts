import { HttpError } from './index';

export class InternalServerError extends HttpError {
    constructor(message?: string) {
        super(message || 'An internal server error occurred', 500);
    }
}
