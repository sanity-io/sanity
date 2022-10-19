import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {Observable} from 'rxjs'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'
import {SearchOptions, WeightedHit} from './weighted/types'

/** @internal */
export function createSearch(
  client: SanityClient,
  schema: Schema
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
