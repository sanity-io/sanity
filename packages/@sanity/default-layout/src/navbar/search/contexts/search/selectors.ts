import {ObjectSchemaType, Schema, SchemaType} from '@sanity/types'
import {getSearchableTypes} from '@sanity/base/_internal'

/**
 * Returns a list of all available document types filtered by a search string.
 * Types containing the search string in its `title` or `name` will be returned.
 */
export function getSelectableTypes(schema: Schema, typeFilter: string): ObjectSchemaType[] {
  // TODO: double check return type of `getSearchableTypes`
  return (getSearchableTypes(schema) as ObjectSchemaType[])
    .filter((type) => inTypeFilter(type, typeFilter))
    .sort(sortTypes)
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

function inTypeFilter(type: SchemaType, typeFilter: string): boolean {
  return !typeFilter || (type.title ?? type.name).toLowerCase().includes(typeFilter?.toLowerCase())
}
