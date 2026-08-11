class ValidationException extends Error {
    constructor(message: string) {
        super(message);

        this.name = "ValidationException";
    }
}

class RequestBodyUndefinedException extends ValidationException {
    constructor() {
        super("Request body is undefined");

        this.name = "RequestBodyUndefinedException";
    }
}

class InvalidBodyException extends ValidationException {
    constructor() {
        super("Request body must be an object");

        this.name = "InvalidBodyException";
    }
}

class RequiredFieldException extends ValidationException {
    constructor(
        public readonly field: string,
    ) {
        super(`Field "${field}" is required`);

        this.name = "RequiredFieldException";
    }
}

class InvalidTypeException extends ValidationException {
    constructor(
        public readonly field: string,
        public readonly expected: string,
        public readonly received: string,
    ) {
        super(
            `Field "${field}" must be of type ${expected}, received ${received}`,
        );

        this.name = "InvalidTypeException";
    }
}

class CustomValidationException extends ValidationException {
    constructor(
        public readonly field: string,
    ) {
        super(`Field "${field}" failed custom validation`);

        this.name = "CustomValidationException";
    }
}

export {
    ValidationException,
    RequestBodyUndefinedException,
    InvalidBodyException,
    RequiredFieldException,
    InvalidTypeException,
    CustomValidationException
}