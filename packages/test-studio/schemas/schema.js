import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {generalCard, childrenRepro, phoneList, phoneListItem} from './children-repro'

export default createSchema({
  name: 'test-examples',
  types: schemaTypes.concat([generalCard, childrenRepro, phoneList, phoneListItem])
})
