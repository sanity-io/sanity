import {type SearchStrategy} from '@sanity/types'

import {
  type SearchStrategyFactory,
  type TextSearchResults,
  type WeightedSearchResults,
} from './common'
import {createTextSearch} from './text-search'
import {createWeightedSearch} from './weighted'

const searchStrategies = {
  groqLegacy: createWeightedSearch,
  textSearch: createTextSearch,
  groq2024: createWeightedSearch,
} satisfies Record<SearchStrategy, SearchStrategyFactory<TextSearchResults | WeightedSearchResults>>

const DEFAULT_SEARCH_STRATEGY: SearchStrategy = 'groqLegacy'

/** @internal */
export const createSearch: SearchStrategyFactory<TextSearchResults | WeightedSearchResults> = (
  searchableTypes,
  client,
  options,
) => {
  const factory = searchStrategies[options.strategy ?? DEFAULT_SEARCH_STRATEGY]
  return factory(searchableTypes, client, options)
}
