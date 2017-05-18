import { HttpError } from './index';

export class NotFoundError extends HttpError {
    constructor(message?: string) {
        super(message || 'The page requested was not found', 404);
    }
}
