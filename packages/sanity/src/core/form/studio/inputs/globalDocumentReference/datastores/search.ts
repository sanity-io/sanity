import {type SanityClient} from '@sanity/client'
import {
  type GlobalDocumentReferenceSchemaType,
  type GlobalDocumentReferenceType,
  type ReferenceFilterSearchOptions,
  type SanityDocumentLike,
} from '@sanity/types'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import type {Groq2024SearchResults} from '../../../../../search/common/types'
import {createSearchQuery} from '../../../../../search/groq2024/createSearchQuery'
import {getNextCursor} from '../../../../../search/groq2024/getNextCursor'
import {type SearchParams} from '../../../../../search/weighted/createSearchQuery'
import {collate} from '../../../../../util/draftUtils'

interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}

const limit = 10

function doSearch(
  client: SanityClient,
  searchTerm: string,
  types: GlobalDocumentReferenceType[],
  searchOptions: ReferenceFilterSearchOptions,
): Observable<Groq2024SearchResults> {
  const {query, params, options, sortOrder} = createSearchQuery(
    {types, query: searchTerm},
    searchTerm,
    searchOptions,
  )

  return client.observable.fetch<SanityDocumentLike[], SearchParams>(query, params).pipe(
    map((hits) => {
      const hasNextPage = typeof limit !== 'undefined' && hits.length > limit

      // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
      // the penultimate result must be used to determine the start of the next page.
      const lastResult = hasNextPage ? hits.at(-2) : hits.at(-1)

      return {
        type: 'groq2024',
        // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
        // exclude the final result if it's beyond the limit.
        hits: hits.map((hit) => ({hit})).slice(0, limit),
        nextCursor: hasNextPage ? getNextCursor({lastResult, sortOrder}) : undefined,
      }
    }),
  )
}

export function search(
  client: SanityClient,
  textTerm: string,
  type: GlobalDocumentReferenceSchemaType,
  options: ReferenceFilterSearchOptions,
): Observable<SearchHit[]> {
  return doSearch(client, textTerm, type.to, options).pipe(
    map(({hits}) => hits.map(({hit}) => hit)),
    map((docs) => collate(docs)),
    map((collated) =>
      collated.map((entry) => ({
        id: entry.id,
        type: entry.type,
        published: entry.published,
      })),
    ),
  )
}
