import {SchemaType, ObjectSchemaType} from '@sanity/types'

export interface FieldValueError {
  message: string
  value: unknown
}

export function getValueError(value: unknown, schemaType: SchemaType): FieldValueError | undefined {
  const {jsonType} = schemaType
  const valueType = Array.isArray(value) ? 'array' : typeof value

  if (value === null || valueType === 'undefined') {
    return undefined
  }

  if (valueType !== jsonType) {
    return {message: `Value is ${valueType}, expected ${jsonType}`, value}
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
