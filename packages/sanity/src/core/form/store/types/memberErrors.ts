import {ArraySchemaType, SchemaType} from '@sanity/types'

/**
 * This error may happen if the member type is structurally incompatible with the defined schema type.
 * Some examples:
 *   - the schema type defines an array, but the actual value is an object (or vice versa)
 *   - the schema type defines a number, but the actual value is a string (or vice versa)
 *   - the schema type defines an object, but the actual value is a string (or vice versa)
 */
export type IncompatibleTypeError = {
  type: 'INCOMPATIBLE_TYPE'
  expectedSchemaType: SchemaType
  resolvedValueType: string
  value: unknown
}

/**
 * This error may happen if the _type of the value is different from the declared schema type
 * It represents a case where we encounter field value that is structurally compatible with the field's defined schema type
 * (e.g. they are both json objects), but the _type name is different from what the schema type expects
 *
 * Note on compatibility: The schema of a field may be defined as an object with fields (a, b, c), but the value is an object with (d, e, f)
 * These are still structurally compatible because (d, e, f) will be considered undeclared members
 */
export type TypeAnnotationMismatchError = {
  type: 'TYPE_ANNOTATION_MISMATCH'
  expectedSchemaType: SchemaType
  resolvedValueType: string
}

/**
 * This error may happen for arrays of objects where one or more of the members are missing a _key
 */
export type MissingKeysError = {
  type: 'MISSING_KEYS'
  schemaType: ArraySchemaType
  value: {_key?: string}[]
}

/**
 * This error may happen for arrays of objects where one or more of the members are having duplicate keys
 */
export type DuplicateKeysError = {
  type: 'DUPLICATE_KEYS'
  schemaType: ArraySchemaType
  duplicates: [index: number, key: string][]
}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 */
export type UndeclaredMembersError = {type: 'UNDECLARED_MEMBERS'; schemaType: ArraySchemaType}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 */
export type MixedArray = {type: 'MIXED_ARRAY'; schemaType: ArraySchemaType}

/**
 * This error may happen for arrays (of both objects and primitive values) if we encounter items that is not valid according to the schema definition
 */
export type InvalidItemTypeError = {
  type: 'INVALID_ITEM_TYPE'
  validTypes: SchemaType[]
  resolvedValueType: string
  value: unknown
}

export interface FieldError {
  kind: 'error'
  key: string
  fieldName: string
  error:
    | IncompatibleTypeError
    | TypeAnnotationMismatchError
    | MissingKeysError
    | DuplicateKeysError
    | UndeclaredMembersError
    | MixedArray
}

export interface ArrayItemError {
  kind: 'error'
  key: string
  index: number
  error: InvalidItemTypeError
}
