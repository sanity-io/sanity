import type {SearchTerms, SearchableType} from '@sanity/base'
import type {Schema, SchemaType} from '@sanity/types'
import {getSearchableTypes} from '@sanity/base/_internal'
import {ObjectSchemaType} from '@sanity/types'

/**
 * Returns a list of all available document types filtered by a search string.
 * Types containing the search string in its `title` or `name` will be returned.
 */
export function getSelectableTypes(schema: Schema, typeFilter: string): SearchableType[] {
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
    (type) => !(type.__experimental_omnisearch_visibility === false)
  )
}

export function hasSearchableTerms(terms: SearchTerms): boolean {
  return terms.query.trim() !== '' || !!terms.types.length
}

export function sortTypes(a: SearchableType, b: SearchableType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

function inTypeFilter(type: SchemaType, typeFilter: string): boolean {
  return !typeFilter || (type.title ?? type.name).toLowerCase().includes(typeFilter?.toLowerCase())
}
