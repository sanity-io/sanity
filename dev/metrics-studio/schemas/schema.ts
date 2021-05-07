import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {deployment, deploymentMetadata} from './deployment'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([deployment, deploymentMetadata]),
})
