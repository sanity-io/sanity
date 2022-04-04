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
    editModal: 'fold', // 'fullscreen' | 'popover' | 'fold'
  },
}

const myObjectBlockType = {
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
    editModal: 'fullscreen', // 'fullscreen' | 'popover' | 'fold'
  },
}

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
  title: 'Body',
  of: [blockType, myObjectBlockType],
}

export const schema = createSchema({
  name: 'default',
  types: [bodyType],
})
