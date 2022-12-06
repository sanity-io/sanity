import type {SearchTerms} from '../../../../../search'

export function hasSearchableTerms({
  allowEmptyQueries,
  terms,
}: {
  allowEmptyQueries?: boolean
  terms: SearchTerms
}): boolean {
  const trimmedQuery = terms.query.trim()
  return (
    (allowEmptyQueries ? typeof trimmedQuery !== 'undefined' : trimmedQuery !== '') ||
    (terms.filter && terms.filter?.trim() !== '') ||
    terms.types.length > 0
  )
}
