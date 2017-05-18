import { HttpError } from './index';

export class BannedError extends HttpError {
    constructor(message?: string) {
        super(message || 'Account cannot access that page', 402);
    }
}
