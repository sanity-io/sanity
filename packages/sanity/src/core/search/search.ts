import {type SearchStrategy} from '@sanity/types'

import {createHybridSearch} from './hybrid'
import {createTextSearch} from './text-search'
import {createWeightedSearch} from './weighted'
import {type SearchStrategyFactory} from './weighted/types'

const searchStrategies: Record<SearchStrategy, SearchStrategyFactory> = {
  weighted: createWeightedSearch,
  text: createTextSearch,
  hybrid: createHybridSearch,
}

/** @internal */
export const createSearch: SearchStrategyFactory = (searchableTypes, client, options) => {
  const strategy = options.strategy ?? 'weighted'
  return searchStrategies[strategy](searchableTypes, client, options)
}
