import {SchemaType} from '../diff'

export function getValueError(value: unknown, schemaType: SchemaType) {
  const {jsonType} = schemaType
  const valueType = Array.isArray(value) ? 'array' : typeof value

  if (value === null || valueType === 'undefined') {
    return undefined
  }

  if (valueType !== jsonType) {
    return {error: `Value is ${valueType}, expected ${jsonType}`, value}
  }

  return undefined
}
