import {type BlockSchemaType, type SchemaType} from '@sanity/types'

export function findBlockType(type: SchemaType): type is BlockSchemaType {
  if (type.type) {
    return findBlockType(type.type)
  }

  if (type.name === 'block') {
    return true
  }

  return false
}
