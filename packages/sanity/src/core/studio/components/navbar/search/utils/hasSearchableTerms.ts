import type {SearchTerms} from '../search/weighted/types'

export function hasSearchableTerms(terms: SearchTerms): boolean {
  return terms.query.trim() !== '' || !!terms.types.length
}
