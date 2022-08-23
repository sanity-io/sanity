import type {SearchTerms, SearchableType} from '@sanity/base'
import type {Schema, SchemaType} from '@sanity/types'
import {getSearchableTypes} from '@sanity/base/_internal'

/**
 * Returns a list of all available document types filtered by a search string.
 * Types containing the search string in its `title` or `name` will be returned.
 */
export function getSelectableTypes(schema: Schema, typeFilter: string): SearchableType[] {
  return getSearchableTypes(schema)
    .filter((type) => inTypeFilter(type, typeFilter))
    .sort(sortTypes)
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
