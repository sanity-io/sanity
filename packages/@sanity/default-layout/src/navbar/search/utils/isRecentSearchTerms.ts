import type {SearchTerms} from '@sanity/base'
import type {RecentSearchTerms} from '../datastores/recentSearches'

export function isRecentSearchTerms(
  terms: SearchTerms | RecentSearchTerms
): terms is RecentSearchTerms {
  return (terms as RecentSearchTerms).__recentTimestamp !== undefined
}
