import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {sortBy} from 'lodash'
import {map, tap} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {type SearchStrategyFactory, type SearchTerms, type WeightedSearchResults} from '../common'
import {applyWeights} from './applyWeights'
import {createSearchQuery} from './createSearchQuery'

function getSearchTerms(
  searchParams: string | SearchTerms,
  types: (SchemaType | CrossDatasetType)[],
) {
  if (typeof searchParams === 'string') {
    return {
      query: searchParams,
      types: types,
    }
  }
  return searchParams.types.length ? searchParams : {...searchParams, types}
}

/**
 * @internal
 */
export const createWeightedSearch: SearchStrategyFactory<WeightedSearchResults> = (
  types,
  client,
  factoryOptions,
) => {
  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOptions = {}) {
    const searchTerms = getSearchTerms(searchParams, types)

    const {query, params, options, searchSpec, terms} = createSearchQuery(searchTerms, {
      ...factoryOptions,
      ...searchOptions,
    })

    return client.observable.fetch<SanityDocumentLike[]>(query, params, options).pipe(
      factoryOptions.unique ? map(removeDupes) : tap(),
      // Assign weighting and scores based on current search terms.
      // No scores will be assigned when terms are empty.
      map((hits) => applyWeights(searchSpec, hits, terms)),
      // Optionally skip client-side score sorting.
      // This can be relevant when ordering results by specific fields, especially dates.
      searchOptions?.skipSortByScore ? tap() : map((hits) => sortBy(hits, (hit) => -hit.score)),
      map((hits) => ({type: 'weighted', hits})),
    )
  }
}
