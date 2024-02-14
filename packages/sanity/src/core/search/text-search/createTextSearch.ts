import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {sortBy} from 'lodash'
import {type Observable} from 'rxjs'
import {map, tap} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {
  type SearchableType,
  type SearchHit,
  type SearchOptions,
  type SearchSpec,
  type SearchTerms,
  type WeightedHit,
  type WeightedSearchOptions,
} from '../weighted/types'
// import {applyWeights} from '../weighted/applyWeights'
import {createSearchQuery} from './createSearchQuery'
import {type TextSearchResponse} from './types'

function getSearchTerms(searchParams: string | SearchTerms, types: SearchableType[]) {
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
export function createTextSearch(
  types: SearchableType[],
  client: SanityClient,
  commonOpts: WeightedSearchOptions = {},
): (searchTerms: string | SearchTerms, searchOpts?: SearchOptions) => Observable<WeightedHit[]> {
  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOpts = {}) {
    const searchTerms = getSearchTerms(searchParams, types)

    const {searchSpec, terms} = createSearchQuery(searchTerms, {
      ...commonOpts,
      ...searchOpts,
    })

    const searchRequest = client.observable.request({
      uri: `/data/textsearch/${client.config().dataset}`,
      method: 'POST',
      json: true,
      body: {
        query: {
          string: searchTerms.query,
        },
      },
    })

    return searchRequest.pipe(
      map(normalizeTextSearchResults),
      commonOpts.unique ? map(removeDupes) : tap(),
      // Assign weighting and scores based on current search terms.
      // No scores will be assigned when terms are empty.
      map((hits: SearchHit[]) => applyWeightsNoop(searchSpec, hits, terms)),
      // Optionally skip client-side score sorting.
      // This can be relevant when ordering results by specific fields, especially dates.
      searchOpts?.skipSortByScore ? tap() : map((hits) => sortBy(hits, (hit) => -hit.score)),
    )
  }
}

function normalizeTextSearchResults(textSearchResponse: TextSearchResponse): SanityDocument[] {
  return textSearchResponse.hits.map((hit) => hit.attributes)
}

// TODO: This is just a workaround to get search working for now.
export function applyWeightsNoop(
  searchSpec: SearchSpec[],
  hits: SearchHit[],
  terms: string[] = [],
): WeightedHit[] {
  return hits.map((hit, index) => {
    return {hit, resultIndex: hits.length - index, score: 1, stories: []}
  })
}
