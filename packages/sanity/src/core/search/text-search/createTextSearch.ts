import {type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'
import {map, switchMap, tap} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {
  type SearchableType,
  type SearchHit,
  type SearchStrategyFactory,
  type SearchTerms,
  type TextSearchResultCollection,
} from '../weighted/types'
import {createTextSearchQuery} from './createTextSearchQuery'
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
export const createTextSearch: SearchStrategyFactory<TextSearchResultCollection> = (
  types,
  client,
  commonOpts,
) => {
  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOpts = {}) {
    const searchTerms = getSearchTerms(searchParams, types)

    const searchRequest = client.observable.request<TextSearchResponse>({
      uri: `/data/textsearch/${client.config().dataset}`,
      method: 'POST',
      json: true,
      body: createTextSearchQuery(searchTerms, {
        ...commonOpts,
        ...searchOpts,
      }),
    })

    return searchRequest.pipe(
      switchMap((textSearchResponse) => {
        return of({
          strategy: 'text' as const,
          hits: of(textSearchResponse).pipe(
            map(normalizeTextSearchResults),
            commonOpts.unique ? map(removeDupes) : tap(),
            map((hits) => boxTextSearchResults(hits)),
          ),
          nextCursor: textSearchResponse.nextCursor,
        })
      }),
    )
  }
}

function normalizeTextSearchResults(textSearchResponse: TextSearchResponse): SanityDocument[] {
  return textSearchResponse.hits.map((hit) => hit.attributes)
}

export function boxTextSearchResults(hits: SearchHit[]): {hit: SearchHit}[] {
  return hits.map((hit) => ({hit}))
}
