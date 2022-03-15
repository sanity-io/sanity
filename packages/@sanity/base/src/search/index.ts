import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'

export function createSearch(client: SanityClient, schema: Schema) {
  // Use >= 2021-03-25 for pt::text() support
  const searchClient = client.withConfig({
    apiVersion: '2021-03-25',
  })

  return createWeightedSearch(getSearchableTypes(schema), searchClient, {
    unique: true,
    tag: 'search.global',
  })
}
