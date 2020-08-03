import schemaTypes from 'all:part:@sanity/base/schema-type'
import createSchema from 'part:@sanity/base/schema-creator'
import allInputs from './allInputs'

export default createSchema({
  name: 'design-studio',
  types: schemaTypes.concat([allInputs])
})
