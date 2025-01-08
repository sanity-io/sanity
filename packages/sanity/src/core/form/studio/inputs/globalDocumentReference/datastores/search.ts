import {type SanityClient} from '@sanity/client'
import {
  type GlobalDocumentReferenceSchemaType,
  type ReferenceFilterSearchOptions,
  type SanityDocumentLike,
} from '@sanity/types'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {createSearch, type Groq2024SearchResults} from '../../../../../search'
import {getNextCursor} from '../../../../../search/groq2024/getNextCursor'
import {collate} from '../../../../../util'
import {type ReferenceClient} from './getReferenceClient'

interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}

const limit = 10

function doSearch(
  textTerm: string,
  client: ReferenceClient<SanityDocumentLike[]>,
): Groq2024SearchResults {
  return client(textTerm).pipe(
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
  const searchStrategy = createSearch(type.to, client, {
    ...options,
  })

  return doSearch(textTerm).pipe(
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
