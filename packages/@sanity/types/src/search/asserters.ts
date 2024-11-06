import {searchStrategies, type SearchStrategy} from './types'

/**
 * @internal
 */
export function isSearchStrategy(
  maybeSearchStrategy: unknown,
): maybeSearchStrategy is SearchStrategy {
  return searchStrategies.includes(maybeSearchStrategy as SearchStrategy)
}
