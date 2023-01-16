import type {SearchTerms} from '../../../../../search'

/**
 * Check if current search terms are valid.
 *
 * By default, completely empty search terms (no search query, types or filter) are considered invalid,
 * unless `allowEmptyQueries` is true.
 */
export function hasSearchableTerms({
  allowEmptyQueries,
  terms,
}: {
  allowEmptyQueries?: boolean
  terms: SearchTerms
}): boolean {
  const hasQuery = allowEmptyQueries ? true : terms.query.length > 0
  const hasFilter = !!terms.filter
  const hasSelectedTypes = terms.types.length > 0

  return hasQuery || hasFilter || hasSelectedTypes
}
