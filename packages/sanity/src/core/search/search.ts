import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'

import {createHybridSearch} from './hybrid'
import {createTextSearch} from './text-search'
import {createWeightedSearch} from './weighted'
import {
  type SearchableType,
  type SearchHit,
  type SearchOptions,
  type WeightedHit,
  type WeightedSearchOptions,
} from './weighted/types'

const searchStrategies = {
  weighted: createWeightedSearch,
  text: createTextSearch,
  hybrid: createHybridSearch,
} as const

type SearchStrategy = keyof typeof searchStrategies

// TODO: Refine approach for opting into and/or automatically enabling text search strategy based
// on search config.
const SEARCH_STRATEGY: SearchStrategy = 'text'

/** @internal */
export function createSearch(
  searchableTypes: SearchableType[],
  client: SanityClient,
  options: WeightedSearchOptions = {},
): (query: string, opts?: SearchOptions) => Observable<(WeightedHit | {hit: SearchHit})[]> {
  const searchStrategy = searchStrategies[SEARCH_STRATEGY]
  return searchStrategy(searchableTypes, client, options)
}
