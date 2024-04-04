import {type SchemaType} from '@sanity/types'

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

/**
 * @hidden
 * @beta */
export interface ArrayItemError {
  kind: 'error'
  key: string
  index: number
  error: InvalidItemTypeError
}
