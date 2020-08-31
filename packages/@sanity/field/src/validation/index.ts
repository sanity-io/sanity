import {SchemaType} from '../diff'

export function getValueError(value: unknown, schemaType: SchemaType) {
  const {jsonType} = schemaType
  const valueType = typeof value

  if (value === null || valueType === 'undefined') {
    return undefined
  }

  if (Array.isArray(value) && jsonType !== 'array') {
    return {error: `Value is array, expected ${jsonType}`, value}
  }

  if (valueType !== jsonType) {
    return {error: `Value is ${valueType}, expected ${jsonType}`, value}
  }

  return undefined
}
