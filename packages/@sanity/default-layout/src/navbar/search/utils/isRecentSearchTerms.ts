import type {SearchTerms} from '@sanity/base'
import type {RecentSearchTerms} from '../datastores/recentSearches'

export function isRecentSearchTerms(
  terms: SearchTerms | RecentSearchTerms
): terms is RecentSearchTerms {
  return typeof (terms as RecentSearchTerms).__recent !== 'undefined'
}
