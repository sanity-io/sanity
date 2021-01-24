import {ObjectSchemaType, ReferenceSchemaType, SchemaType, TitledListValue} from './types'

export function isObjectSchemaType(type: SchemaType): type is ObjectSchemaType {
  return type.jsonType === 'object'
}

export function isReferenceSchemaType(
  type: SchemaType | ReferenceSchemaType
): type is ReferenceSchemaType {
  return type.jsonType === 'object' && 'to' in type && Array.isArray(type.to)
}

export function isTitledListValue(item: unknown): item is TitledListValue {
  return typeof item === 'object' && item !== null && 'title' in item && 'value' in item
}
