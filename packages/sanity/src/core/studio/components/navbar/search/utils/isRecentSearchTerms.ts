import type {RecentOmnisearchTerms} from '../datastores/recentSearches'
import type {OmnisearchTerms} from '../types'

export function isRecentSearchTerms(
  terms: OmnisearchTerms | RecentOmnisearchTerms
): terms is RecentOmnisearchTerms {
  return typeof (terms as RecentOmnisearchTerms).__recent !== 'undefined'
}
