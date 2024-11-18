import {type SearchStrategy} from '@sanity/types'

import {
  type Groq2024SearchResults,
  type SearchStrategyFactory,
  type TextSearchResults,
  type WeightedSearchResults,
} from './common'
import {createGroq2024Search} from './groq2024'
import {createTextSearch} from './text-search'
import {createWeightedSearch} from './weighted'

const searchStrategies = {
  groqLegacy: createWeightedSearch,
  textSearch: createTextSearch,
  groq2024: createGroq2024Search,
} satisfies Record<
  SearchStrategy,
  SearchStrategyFactory<TextSearchResults | WeightedSearchResults | Groq2024SearchResults>
>

const DEFAULT_SEARCH_STRATEGY: SearchStrategy = 'groqLegacy'

/** @internal */
export const createSearch: SearchStrategyFactory<
  TextSearchResults | WeightedSearchResults | Groq2024SearchResults
> = (searchableTypes, client, options) => {
  const factory = searchStrategies[options.strategy ?? DEFAULT_SEARCH_STRATEGY]
  return factory(searchableTypes, client, options)
}
