// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import schema from 'part:@sanity/base/schema'
import {versionedClient} from '../client/versionedClient'
import {getSearchableTypes} from './common/utils'
import {createWeightedSearch} from './weighted/createWeightedSearch'

export default createWeightedSearch(getSearchableTypes(schema), versionedClient, {
  tag: 'search.global',
})
