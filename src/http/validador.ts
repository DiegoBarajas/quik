import {
    ValidationException,
    RequestBodyUndefinedException,
    InvalidBodyException,
    RequiredFieldException,
    InvalidTypeException
} from "./exceptions.js";

// Types
type ValidatorType =
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ObjectConstructor
    | ArrayConstructor;

type FieldDefinition = {
    type: ValidatorType;
    required?: boolean;
    validator?: (value: unknown) => unknown | ValidationException;
};

interface BodyFields {
    [name: string]: FieldDefinition;
}


const Validator = {
    body(body: unknown, fields: BodyFields) {
        if (body === undefined) {
            throw new RequestBodyUndefinedException();
        }

        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new InvalidBodyException();
        }

        // HOLA
        
    },
};

function isValidType(value: unknown, type: ValidatorType): boolean {
    if (type === String) {
        return typeof value === "string";
    }

    if (type === Number) {
        return typeof value === "number";
    }

    if (type === Boolean) {
        return typeof value === "boolean";
    }

    if (type === Object) {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }

    if (type === Array) {
        return Array.isArray(value);
    }

    return false;
}

export { Validator };