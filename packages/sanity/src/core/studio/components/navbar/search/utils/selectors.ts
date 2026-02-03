import {type ObjectSchemaType, type Schema, type SchemaType} from '@sanity/types'

import {getSearchableTypes} from '../../../../../search'

/**
 * Returns a list of all available document types filtered by a search string.
 * Types containing the search string in its `title` or `name` will be returned.
 */
export function getSelectableOmnisearchTypes(schema: Schema, typeFilter: string): SchemaType[] {
  return getSearchableOmnisearchTypes(schema)
    .filter((type) => inTypeFilter(type, typeFilter))
    .sort(sortTypes)
}

/**
 * Return all searchable document types that are visible to omnisearch.
 * Documents with `__experimental_omnisearch_visibility: false` will be hidden.
 */
export function getSearchableOmnisearchTypes(schema: Schema): ObjectSchemaType[] {
  return getSearchableTypes(schema).filter(
    (type) => !(type.__experimental_omnisearch_visibility === false),
  )
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

function inTypeFilter(type: SchemaType, typeFilter: string): boolean {
  return !typeFilter || (type.title ?? type.name).toLowerCase().includes(typeFilter?.toLowerCase())
}
