import type {SearchTerms, SearchableType} from '@sanity/base'
import type {Schema} from '@sanity/types'
import {getSearchableTypes} from '@sanity/base/_internal'
import {partition} from 'lodash'

/**
 * Returns a list of all available document types, partitioned by selected / non-selected types
 */
export function getSortedSearchableTypes(
  schema: Schema,
  selectedTypes: SearchableType[] = []
): SearchableType[] {
  const searchableTypes = getSearchableTypes(schema)

  // Partition into selected / non-selected types
  const [selected, nonSelected] = partition(searchableTypes, (type) => {
    return selectedTypes.find((selectedType) => selectedType.name === type.name)
  })

  return [
    ...selected.sort(sortTypes), //
    ...nonSelected.sort(sortTypes),
  ]
}

export function hasSearchableTerms(terms: SearchTerms): boolean {
  return terms.query.trim() !== '' || !!terms.types.length
}

export function sortTypes(a: SearchableType, b: SearchableType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

export function inTypeFilter(type: SearchableType, typeFilter: string): boolean {
  return !typeFilter || (type.title ?? type.name).toLowerCase().includes(typeFilter?.toLowerCase())
}
