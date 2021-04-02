import schema from 'part:@sanity/base/schema'
import {versionedClient} from '../client/versionedClient'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'

// Use >= 2021-03-25 for pt::text() support
const searchClient = versionedClient.withConfig({
  apiVersion: '2021-03-25',
})

export default createWeightedSearch(getSearchableTypes(schema), searchClient)
