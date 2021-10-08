import Schema from '@sanity/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {baseTypes} from '../baseTypes'

const imageType = {
  type: 'image',
  name: 'blockImage',
}

const someObject = {
  type: 'object',
  name: 'someObject',
  options: {
    editModal: 'fullscreen',
  },
  fields: [{type: 'string', name: 'title'}],
}

export const blockType = {
  type: 'block',
  name: 'myBlockType',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'H1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
    {title: 'H5', value: 'h5'},
    {title: 'H6', value: 'h6'},
    {title: 'Quote', value: 'blockquote'},
  ],
  of: [someObject, imageType],
}

const ptType = {
  type: 'array',
  name: 'body',
  of: [blockType, imageType, someObject],
}

export const schema = Schema.compile({
  name: 'default',
  types: schemaTypes.concat([imageType, someObject, ptType]).concat(baseTypes),
})

export const portableTextType = schema.get('body')
