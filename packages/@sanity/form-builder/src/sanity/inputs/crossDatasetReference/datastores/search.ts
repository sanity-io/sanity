import {map} from 'rxjs/operators'

import {CrossDatasetReferenceSchemaType, ReferenceFilterSearchOptions} from '@sanity/types'
import {Observable} from 'rxjs'
import {collate, createWeightedSearch} from '@sanity/base/_internal'

// eslint-disable-next-line camelcase
import {SanityClient} from '@sanity/client'

interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}

export function search(
  client: SanityClient,
  textTerm: string,
  type: CrossDatasetReferenceSchemaType,
  options: ReferenceFilterSearchOptions
): Observable<SearchHit[]> {
  const searchWeighted = createWeightedSearch(
    type.to.map((crossDatasetType) => ({
      name: crossDatasetType.type,
      // eslint-disable-next-line camelcase
      __experimental_search:
        // NOTE: `__experimental_search` is aliased to `searchConfig` because
        // cross-dataset refs require this config and we don't want to have the
        // this experimental API be required
        crossDatasetType.searchConfig || crossDatasetType.__experimental_search,
    })),
    client,
    options
  )
  return searchWeighted(textTerm, {includeDrafts: false}).pipe(
    // pick the 100 best matches
    map((results) => results.map((result) => result.hit)),
    map(collate),
    map((collated) =>
      collated.map((entry) => ({
        id: entry.id,
        type: entry.type,
        published: entry.published,
      }))
    )
  )
}
