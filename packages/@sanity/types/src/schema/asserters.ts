import {ObjectSchemaType, SchemaType} from './types'

export function isObjectSchemaType(type: SchemaType): type is ObjectSchemaType {
  return type.jsonType === 'object'
}
