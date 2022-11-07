import type {SearchTerms} from '../../../../../search'

export function hasSearchableTerms(terms: SearchTerms): boolean {
  return (
    terms.query.trim() !== '' ||
    (terms.filter && terms.filter?.trim() !== '') ||
    terms.types.length > 0
  )
}
