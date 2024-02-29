import {
  type SearchStrategyFactory,
  type TextSearchResults,
  type WeightedSearchResults,
} from './common'
import {createTextSearch} from './text-search'
import {createWeightedSearch} from './weighted'

/** @internal */
export const createSearch: SearchStrategyFactory<TextSearchResults | WeightedSearchResults> = (
  searchableTypes,
  client,
  options,
) => {
  const factory = options.unstable_enableNewSearch ? createTextSearch : createWeightedSearch
  return factory(searchableTypes, client, options)
}
