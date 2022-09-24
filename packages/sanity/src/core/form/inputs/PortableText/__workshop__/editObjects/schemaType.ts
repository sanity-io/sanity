import {defineType} from '@sanity/types'
import {createSchema} from '../../../../../schema'

const linkType = {
  type: 'object',
  name: 'link',
  title: 'Link',
  fields: [
    {
      type: 'string',
      name: 'url',
      title: 'URL',
    },
  ],

  options: {
    modal: {type: 'popover'},
  },
}

const myObjectBlockType = defineType({
  type: 'object',
  name: 'myObjectBlock',
  title: 'My object block',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],

  options: {
    modal: {type: 'dialog', width: 'auto'},
  },
})

const myInlineObjectType = {
  type: 'object',
  name: 'myInlineObject',
  title: 'My inline object',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],

  options: {
    modal: {type: 'popover'},
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
  title: 'Body',
  of: [blockType, myObjectBlockType],
}

export const schema = createSchema({
  name: 'default',
  types: [bodyType],
})
