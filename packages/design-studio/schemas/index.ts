import schemaTypes from 'all:part:@sanity/base/schema-type'
import createSchema from 'part:@sanity/base/schema-creator'

// document types
import allInputs from './allInputs'
import author from './author'
import live from './live'
import pt from './pt'

export default createSchema({
  name: 'design-studio',
  types: schemaTypes.concat([allInputs, author, live, pt])
})
