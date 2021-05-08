import schema from 'part:@sanity/base/schema'
import {versionedClient} from '../client/versionedClient'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'

export default createWeightedSearch(getSearchableTypes(schema), versionedClient, {
  tag: 'search.global',
})
