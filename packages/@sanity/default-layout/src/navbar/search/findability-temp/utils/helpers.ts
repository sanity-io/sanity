import {SchemaType} from '@sanity/types'

export function getRootType(type: SchemaType): SchemaType {
  if (!type.type) {
    return type
  }
  return getRootType(type.type)
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}
