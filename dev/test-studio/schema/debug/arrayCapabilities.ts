import {defineType} from '@sanity/types'

const DISABLED_ACTIONS = ['add', 'duplicate', 'addBefore', 'addAfter', 'remove', 'copy'] as const

export const arrayCapabilities = defineType({
  name: 'arrayCapabilities',
  type: 'document',
  title: 'Array Capabilities test',
  // icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'objectArray',
      options: {
        collapsible: true,
        collapsed: true,
        disableActions: DISABLED_ACTIONS,
      },
      title: 'Object array',
      description: `With disabledActions: ${DISABLED_ACTIONS.join(', ')}`,
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          fields: [{name: 'first', type: 'string', title: 'First string'}],
        },
      ],
      initialValue: [{_type: 'something', first: 'First'}],
    },
    {
      name: 'objectArrayAsGrid',
      options: {
        layout: 'grid',
        collapsible: true,
        collapsed: true,
        disableActions: DISABLED_ACTIONS,
      },
      title: 'Object array with grid layout',
      description: `With disabledActions: ${DISABLED_ACTIONS.join(', ')}`,
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          fields: [{name: 'first', type: 'string', title: 'First string'}],
        },
      ],
    },
    {
      name: 'primitiveArray',
      options: {
        collapsible: true,
        collapsed: true,
        disableActions: DISABLED_ACTIONS,
      },
      title: 'Primitive array',
      description: `With disabledActions: ${DISABLED_ACTIONS.join(', ')}`,
      type: 'array',
      of: [
        {
          type: 'string',
          title: 'A string',
        },
        {
          type: 'number',
          title: 'A number',
        },
      ],
    },
    {
      name: 'arrayOfReferences',
      title: 'Array of references to authors',
      description: `With disabledActions: ${DISABLED_ACTIONS.join(', ')}`,
      type: 'array',
      options: {
        collapsible: true,
        collapsed: true,
        disableActions: DISABLED_ACTIONS,
      },
      of: [{type: 'reference', to: [{type: 'author'}]}],
      // initialValue: [{_type: 'reference', _ref: '0154f201-bb53-4048-b9e3-7f7cdcad14fb'}],
    },
  ],
})
