import {defineType} from '@sanity/types'

const DISABLED_ACTIONS = ['add', 'addBefore', 'addAfter', 'duplicate', 'remove', 'copy'] as const

export const arrayCapabilities = defineType({
  name: 'arrayCapabilitiesExample',
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
  ],
})
