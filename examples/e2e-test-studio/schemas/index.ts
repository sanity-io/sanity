import schemaTypes from 'all:part:@sanity/base/schema-type'
import createSchema from 'part:@sanity/base/schema-creator'

import {booleansSchema} from './booleans'

export default createSchema({
  name: 'e2e-tests',
  types: schemaTypes.concat([booleansSchema]),
})
