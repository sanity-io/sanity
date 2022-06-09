import {isArraySchemaType, isObjectSchemaType, SchemaType} from '@sanity/types'

export function createProtoValue(type: SchemaType): any {
  if (isObjectSchemaType(type)) {
    return type.name === 'object' ? {} : {_type: type.name}
  }
  if (isArraySchemaType(type)) {
    return []
  }
  if (type.jsonType === 'string') {
    return ''
  }
  if (type.jsonType === 'number') {
    return 0
  }
  if (type.jsonType === 'boolean') {
    return false
  }
  return undefined
}
