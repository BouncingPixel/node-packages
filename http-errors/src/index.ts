export declare class Error {
    public name: string;
    public message: string;
    public stack: string;
    constructor(message?: string);
}

export class HttpError extends Error {
    constructor(public message: string, public status: number) {
        super(message);
        this.name = 'Exception';
        this.stack = (<any>new Error()).stack;
    }
    toString() {
        return this.name + '(' + this.status + ')' + ': ' + this.message;
    }
}
