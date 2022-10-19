import type {RecentSearchTerms} from '../datastores/recentSearches'
import type {SearchTerms} from '../../../../../search'

export function isRecentSearchTerms(
  terms: SearchTerms | RecentSearchTerms
): terms is RecentSearchTerms {
  return typeof (terms as RecentSearchTerms).__recent !== 'undefined'
}
