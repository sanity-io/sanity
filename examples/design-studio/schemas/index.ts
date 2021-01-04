import schemaTypes from 'all:part:@sanity/base/schema-type'
import createSchema from 'part:@sanity/base/schema-creator'

// document types
// NOTE: keep this alphabetized
import allInputs from './allInputs'
import arrayInArray from './arrayInArray'
import author from './author'
import complexArrays from './complexArrays'
import live from './live'
import pt from './pt'
import settings from './settings'

export default createSchema({
  name: 'design-studio',
  types: schemaTypes.concat([
    // NOTE: keep this alphabetized
    allInputs,
    arrayInArray,
    author,
    complexArrays,
    live,
    pt,
    settings,
  ]),
})
