import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {type Observable, of} from 'rxjs'
import {map, switchMap, tap} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {
  type SearchableType,
  type SearchHit,
  type SearchOptions,
  type SearchTerms,
  type WeightedSearchOptions,
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

interface SearchHitsPage {
  hits: SearchHit[]
  pageIncrement: () => Observable<SearchHitsPage>
}

/**
 * @internal
 */
export function createTextSearch(
  types: SearchableType[],
  client: SanityClient,
  commonOpts: WeightedSearchOptions = {},
): (searchTerms: string | SearchTerms, searchOpts?: SearchOptions) => Observable<SearchHitsPage> {
  // let nextCursor: string | undefined

  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOpts = {}) {
    const searchTerms = getSearchTerms(searchParams, types)

    const searchRequest = client.observable.request({
      uri: `/data/textsearch/${client.config().dataset}`,
      method: 'POST',
      json: true,
      body: createTextSearchQuery(searchTerms, {
        ...commonOpts,
        ...searchOpts,
      }),
    })

    return searchRequest.pipe(
      // tap(searchResult => setNextCursor()),
      switchMap((textSearchResponse) => {
        return of({
          hits: of(textSearchResponse).pipe(
            map(normalizeTextSearchResults),
            commonOpts.unique ? map(removeDupes) : tap(),
            map((hits: SearchHit[]) => boxTextSearchResults(hits)),
          ),
          nextCursor: textSearchResponse.nextCursor,
          // fetchNextPage: () => search(searchParams, searchOpts), // with next cursor
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
