import type {OmnisearchTerms} from '../types'

export function hasSearchableTerms(terms: OmnisearchTerms): boolean {
  return terms.query.trim() !== '' || terms.filters.length > 0 || terms.types.length > 0
}
