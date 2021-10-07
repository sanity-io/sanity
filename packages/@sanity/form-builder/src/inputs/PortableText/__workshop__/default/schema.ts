import Schema from '@sanity/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {baseTypes} from '../baseTypes'

const ptType = {
  type: 'array',
  name: 'body',
  of: [{type: 'block'}],
}

export const schema = Schema.compile({
  name: 'default',
  types: schemaTypes.concat([ptType]).concat(baseTypes),
})

export const portableTextType = schema.get('body')
