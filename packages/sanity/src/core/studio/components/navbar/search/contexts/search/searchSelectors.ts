import {type SchemaType} from '@sanity/types'

import {type SearchFilter} from '../../types'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {type GlobalSearchSnapshot, type SearchDefinitions} from './globalSearchMachine'

export function selectDefinitions(snapshot: GlobalSearchSnapshot): SearchDefinitions {
  return snapshot.context.definitions
}

export function selectDocumentTypesNarrowed(snapshot: GlobalSearchSnapshot): string[] {
  return snapshot.context.documentTypesNarrowed
}

export function selectFilters(snapshot: GlobalSearchSnapshot): SearchFilter[] {
  return snapshot.context.filters
}

/** Whether there is a query, filter or type to search on, as opposed to showing recent searches. */
export function selectHasSearchableTerms(snapshot: GlobalSearchSnapshot): boolean {
  return hasSearchableTerms({terms: snapshot.context.terms})
}

export function selectSelectedTypes(snapshot: GlobalSearchSnapshot): SchemaType[] {
  return snapshot.context.terms.types
}
