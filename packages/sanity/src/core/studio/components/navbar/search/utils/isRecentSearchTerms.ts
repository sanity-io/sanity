import type {SearchTerms} from '../../../../../search'
import type {RecentSearch} from '../datastores/recentSearches'

export function isRecentSearchTerms(terms: SearchTerms | RecentSearch): terms is RecentSearch {
  return typeof (terms as RecentSearch).__recent !== 'undefined'
}
