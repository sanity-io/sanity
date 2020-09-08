import {SchemaType, ObjectSchemaType} from '../diff'

export function getValueError(value: unknown, schemaType: SchemaType) {
  const {jsonType} = schemaType
  const valueType = Array.isArray(value) ? 'array' : typeof value

  if (value === null || valueType === 'undefined') {
    return undefined
  }

  if (valueType !== jsonType) {
    return {error: `Value is ${valueType}, expected ${jsonType}`, value}
  }

  if (isObjectType(schemaType) && isObjectValue(value)) {
    return schemaType.fields.find(field => getValueError(value[field.name], field.type))
  }

  return undefined
}

function isObjectType(schemaType: SchemaType): schemaType is ObjectSchemaType {
  return schemaType.jsonType === 'object'
}

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}
