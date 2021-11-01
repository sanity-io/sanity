import Schema from '@sanity/schema'
import schemaTypes from 'all:part:@sanity/base/schema-type'
import {baseTypes} from '../baseTypes'

const linkType = {
  type: 'object',
  name: 'link',
  title: 'Link',
  fields: [],
  options: {
    editModal: 'fold', // 'fullscreen' | 'popover' | 'fold'
  },
}

const myObjectBlockType = {
  type: 'object',
  name: 'myObjectBlock',
  title: 'My object block',
  fields: [],
  options: {
    editModal: 'fullscreen', // 'fullscreen' | 'popover' | 'fold'
  },
}

const myInlineObjectType = {
  type: 'object',
  name: 'myInlineObject',
  title: 'My inline object',
  fields: [],
  options: {
    editModal: 'popover', // 'fullscreen' | 'popover' | 'fold'
  },
}

const blockType = {
  type: 'block',
  marks: {
    annotations: [linkType],
  },
  of: [myInlineObjectType, myObjectBlockType],
}

const bodyType = {
  type: 'array',
  name: 'body',
  of: [blockType, myObjectBlockType],
}

export const schema = Schema.compile({
  name: 'default',
  types: schemaTypes.concat([bodyType]).concat(baseTypes),
})

export const schemaType = schema.get('body')
