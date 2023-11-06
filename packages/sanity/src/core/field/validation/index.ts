import {SchemaType, ObjectSchemaType} from '@sanity/types'
import {getPrintableType} from '../../util/getPrintableType'
import {StudioLocaleResourceKeys} from '../../i18n'

/** @internal */
export interface FieldValueError {
  /**
   * i18n key for the error message
   */
  messageKey: StudioLocaleResourceKeys

  /**
   * The expected type of the value
   */
  expectedType: string

  /**
   * The actual type of the value
   */
  actualType: string

  /**
   * The actual value of the field
   */
  value: unknown
}

/** @internal */
export function getValueError(value: unknown, schemaType: SchemaType): FieldValueError | undefined {
  const {jsonType} = schemaType
  const valueType = Array.isArray(value) ? 'array' : typeof value

  if (value === null || valueType === 'undefined') {
    return undefined
  }

  if (valueType !== jsonType) {
    return {
      messageKey: 'changes.error.incorrect-type-message',
      value,
      expectedType: jsonType,
      actualType: getPrintableType(value),
    }
  }

  if (isObjectType(schemaType) && isObjectValue(value)) {
    for (const field of schemaType.fields) {
      const fieldError = getValueError(value[field.name], field.type as SchemaType)
      if (fieldError) {
        return fieldError
      }
    }
  }

  return undefined
}

function isObjectType(schemaType: SchemaType): schemaType is ObjectSchemaType {
  return schemaType.jsonType === 'object'
}

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}
