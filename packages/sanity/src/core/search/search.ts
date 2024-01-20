import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {type Observable} from 'rxjs'

import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'
import {type SearchOptions, type WeightedHit} from './weighted/types'

/** @internal */
export function createSearch(
  client: SanityClient,
  schema: Schema,
): (query: string, opts?: SearchOptions) => Observable<WeightedHit[]> {
  const searchClient = client.withConfig({
    // Use >= 2021-03-25 for pt::text() support
    apiVersion: '2021-03-25',
  })

  return createWeightedSearch(getSearchableTypes(schema), searchClient, {
    unique: true,
    tag: 'search.global',
  })
}
