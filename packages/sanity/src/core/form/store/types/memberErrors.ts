import {ArraySchemaType, SchemaType} from '@sanity/types'

/**
 * This error may happen if the member type is structurally incompatible with the defined schema type.
 * Some examples:
 *   - the schema type defines an array, but the actual value is an object (or vice versa)
 *   - the schema type defines a number, but the actual value is a string (or vice versa)
 *   - the schema type defines an object, but the actual value is a string (or vice versa)
 *
 * @public
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
 *
 * @public
 */
export type TypeAnnotationMismatchError = {
  type: 'TYPE_ANNOTATION_MISMATCH'
  expectedSchemaType: SchemaType
  resolvedValueType: string
}

/**
 * This error may happen for arrays of objects where one or more of the members are missing a _key
 *
 * @public
 */
export type MissingKeysError = {
  type: 'MISSING_KEYS'
  schemaType: ArraySchemaType
  value: {_key?: string}[]
}

/**
 * This error may happen for arrays of objects where one or more of the members are having duplicate keys
 *
 * @public
 */
export type DuplicateKeysError = {
  type: 'DUPLICATE_KEYS'
  schemaType: ArraySchemaType
  duplicates: [index: number, key: string][]
}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 *
 * @public
 */
export type UndeclaredMembersError = {type: 'UNDECLARED_MEMBERS'; schemaType: ArraySchemaType}

/**
 * This error may happen for objects if we encounter fields that are not declared in the schema
 *
 * @public
 */
export type MixedArrayError = {type: 'MIXED_ARRAY'; schemaType: ArraySchemaType; value: unknown[]}

/**
 * This error may happen for arrays (of both objects and primitive values) if we encounter items that are not valid according to the schema definition
 *
 *
 * @hidden
 * @beta
 */
export type InvalidItemTypeError = {
  type: 'INVALID_ITEM_TYPE'
  validTypes: SchemaType[]
  resolvedValueType: string
  value: unknown
}

/**
 * Represents an error that occurred in a specific field of a data object.
 * @public
 *
 * @remarks
 * This interface is used to provide detailed information about the error,
 * including the field name, the error type, and the error message.
 */
export interface FieldError {
  /**
   * The type of error that occurred.
   */
  kind: 'error'
  /**
   * The unique identifier for the error.
   */
  key: string
  /**
   * The name of the field that the error occurred in.
   */
  fieldName: string
  /**
   * The specific error that occurred.
   *
   * ```md
   * Possible error types include:
   * - IncompatibleTypeError
   * - TypeAnnotationMismatchError
   * - MissingKeysError
   * - DuplicateKeysError
   * - UndeclaredMembersError
   * - MixedArrayError
   * ```
   *
   * See {@link IncompatibleTypeError},
   * {@link TypeAnnotationMismatchError},
   * {@link MissingKeysError},
   * {@link DuplicateKeysError},
   * {@link UndeclaredMembersError} and
   * {@link MixedArrayError} for more information.
   *
   */
  error:
    | IncompatibleTypeError
    | TypeAnnotationMismatchError
    | MissingKeysError
    | DuplicateKeysError
    | UndeclaredMembersError
    | MixedArrayError
}

/**
 * @hidden
 * @beta */
export interface ArrayItemError {
  kind: 'error'
  key: string
  index: number
  error: InvalidItemTypeError
}
