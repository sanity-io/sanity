import {type SanityClient} from '@sanity/client'
import {resolveSearchConfigForBaseFieldPaths} from '@sanity/schema/_internal'
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
  const searchWeighted = createSearch(
    type.to.map((crossDatasetType) => ({
      name: crossDatasetType.type,
      // eslint-disable-next-line camelcase
      __experimental_search: resolveSearchConfigForBaseFieldPaths(
        crossDatasetType,
        options.maxFieldDepth,
      ),
    })),
    client,
    options,
  )

  return searchWeighted(textTerm, {includeDrafts: false}).pipe(
    map(({hits}) => hits.map(({hit}) => hit)),
    map(collate),
    map((collated) =>
      collated.map((entry) => ({
        id: entry.id,
        type: entry.type,
        published: entry.published,
      })),
    ),
  )
}
