import {type SanityClient} from '@sanity/client'
import {
  type CrossDatasetReferenceSchemaType,
  type ReferenceFilterSearchOptions,
} from '@sanity/types'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {createSearch} from '../../../../../search'
import {collate} from '../../../../../util'

interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}

export function search(
  client: SanityClient,
  textTerm: string,
  type: CrossDatasetReferenceSchemaType,
  options: ReferenceFilterSearchOptions,
): Observable<SearchHit[]> {
  const searchStrategy = createSearch(type.to, client, {
    ...options,
    maxDepth: options.maxFieldDepth,
  })

  return searchStrategy(textTerm, {
    includeDrafts: false,
    isCrossDataset: true,
  }).pipe(
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
