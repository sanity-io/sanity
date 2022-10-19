import type {SearchTerms} from '../../../../../search'

export function hasSearchableTerms(terms: SearchTerms): boolean {
  return terms.query.trim() !== '' || !!terms.types.length
}
