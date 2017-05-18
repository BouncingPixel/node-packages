import { HttpError } from './index';

export class AccountLockedError extends HttpError {
    constructor(message?: string) {
        super(message ||'Your account is locked', 429);
    }
}
