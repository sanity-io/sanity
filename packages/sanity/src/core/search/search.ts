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
  const factory = options.enableLegacySearch ? createWeightedSearch : createTextSearch
  return factory(searchableTypes, client, options)
}
