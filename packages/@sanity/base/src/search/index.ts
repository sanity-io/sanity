// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import schema from 'part:@sanity/base/schema'
import {versionedClient} from '../client/versionedClient'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'

// Use >= 2021-03-25 for pt::text() support
const searchClient = versionedClient.withConfig({
  apiVersion: '2021-03-25',
})

export default createWeightedSearch(getSearchableTypes(schema), searchClient, {
  unique: true,
  tag: 'search.global',
})

export * from './weighted'
