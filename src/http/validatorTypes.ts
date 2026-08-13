import type { ValidationException } from "./exceptions.js";

export class ArrayType {
    type: PrimitiveType[];
    description = "array";
    empty: boolean = false;

    constructor(...type: PrimitiveType[]) {
        this.type = [...type];
        this.empty = false;

        const types = type.map((t) => t.description);
        this.description = `array(${types.join(" | ")})`;
    }

    canBeEmpty() {
        this.empty = true;
        return this;
    }
}

export type FieldDefinition = {
    type: ValidatorType;
    required?: boolean;
    validator?: (value: unknown) => unknown | ValidationException;
};

export type ObjectFields = {
    [name: string]: FieldDefinition;
};

export class ObjectType {
    fields: ObjectFields;
    description = "object";

    constructor(fields: ObjectFields) {
        this.fields = fields;

        const names = Object.keys(fields);

        this.description = `object{${names.join(", ")}}`;
    }
}

function Array(...type: PrimitiveType[]) {
    return new ArrayType(...type);
}

function Struct(fields: ObjectFields) {
    return new ObjectType(fields);
}

export const Types = {
    String: Symbol("string"),
    Number: Symbol("number"),
    Int: Symbol("int"),
    Float: Symbol("float"),
    Boolean: Symbol("boolean"),
    Object: Symbol("object"),
    Null: Symbol("null"),
    Any: Symbol("any"),
    
    Array,
    Struct,
};

export type PrimitiveType =
    | typeof Types.String
    | typeof Types.Number
    | typeof Types.Int
    | typeof Types.Float
    | typeof Types.Boolean
    | typeof Types.Object
    | typeof Types.Null;

export type MultiType = PrimitiveType[];

export type ValidatorType =
    | PrimitiveType
    | MultiType
    | ArrayType
    | ObjectType;