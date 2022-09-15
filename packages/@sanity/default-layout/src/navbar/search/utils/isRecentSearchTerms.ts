import type {SearchTerms} from '@sanity/base'
import type {RecentSearchTerms} from '../datastores/recentSearches'

export function isRecentSearchTerms(
  terms: SearchTerms | RecentSearchTerms
): terms is RecentSearchTerms {
  const recentSearchTerms = terms as RecentSearchTerms
  return (
    typeof recentSearchTerms.__recentTimestamp !== 'undefined' &&
    typeof recentSearchTerms.__index === 'number'
  )
}
