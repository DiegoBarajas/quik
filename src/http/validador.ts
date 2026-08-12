import {
    ValidationException,
    RequestBodyUndefinedException,
    InvalidBodyException,
    RequiredFieldException,
    InvalidTypeException,
    EmptyArrayException
} from "./exceptions.js";

import {
    ArrayType,
    ObjectType,
    Types
} from "./validatorTypes.js";

import type {
    ValidatorType,
    ObjectFields
} from "./validatorTypes.js";

type FieldDefinition = {
    type: ValidatorType;
    required?: boolean;
    validator?: (
        value: unknown
    ) => unknown | ValidationException;
};

interface BodyFields {
    [name: string]: FieldDefinition;
}

interface Body {
    [name: string]: unknown;
}

const Validator = {
    body(body: Body, fields: BodyFields) {
        if (body === undefined) {
            throw new RequestBodyUndefinedException();
        }

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            throw new InvalidBodyException();
        }

        return validateObject(body, fields);
    }
};

function validateObject(
    body: unknown,
    fields: ObjectFields,
    parentPath = ""
): Record<string, unknown> {

    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        throw new InvalidBodyException();
    }

    const bodyData = body as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    for (const name in fields) {
        const field = fields[name];

        if (!field) {
            continue;
        }

        const fieldPath = parentPath
            ? `${parentPath}.${name}`
            : name;

        let value = bodyData[name];

        // Required field
        if (field.required && value === undefined) {
            throw new RequiredFieldException(fieldPath);
        }

        // Optional field not provided
        if (value === undefined) {
            continue;
        }

        // Validate type
        if (!validateType(field.type, value, fieldPath)) {
            const type = getTypeDescription(field.type);

            throw new InvalidTypeException(
                fieldPath,
                type,
                whatTypeIs(value)
            );
        }

        // Custom validator
        if (field.validator) {
            const result = field.validator(value);

            if (result instanceof ValidationException) {
                throw result;
            }

            value = result;
        }

        data[name] = value;
    }

    return data;
}

function validateType(
    type: ValidatorType | undefined,
    value: unknown,
    fieldName = ""
): boolean {

    // Multiple types
    if (Array.isArray(type)) {
        return type.some((t) =>
            validateType(t, value, fieldName)
        );
    }

    // Array
    if (type instanceof ArrayType) {

        if (!Array.isArray(value)) {
            return false;
        }

        if (!type.empty && value.length === 0) {
            throw new EmptyArrayException(fieldName);
        }

        for (const item of value) {
            if (!validateType(type.type, item, fieldName)) {
                return false;
            }
        }

        return true;
    }

    // Object structure
    if (type instanceof ObjectType) {

        if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
        ) {
            return false;
        }

        validateObject(
            value,
            type.fields,
            fieldName
        );

        return true;
    }

    // Primitive types
    switch (type?.description) {

        case "null":
            return value === null;

        case "string":
            return typeof value === "string";

        case "number":
        case "float":
            return typeof value === "number";

        case "int":
            return (
                typeof value === "number" &&
                Number.isInteger(value)
            );

        case "boolean":
            return typeof value === "boolean";

        case "object":
            return (
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
            );
    }

    return false;
}

function getTypeDescription(
    type: ValidatorType
): string {

    if (Array.isArray(type)) {
        return type
            .map((t) => getTypeDescription(t))
            .join(" | ");
    }

    return type.description || "";
}

function whatTypeIs(value: unknown): string {

    if (
        typeof value === "number" &&
        Number.isInteger(value)
    ) {
        return "int";
    }

    if (Array.isArray(value)) {
        return "array";
    }

    if (value === null) {
        return "null";
    }

    return typeof value;
}

export {
    Validator
};