import {GoPuzzle as icon} from 'react-icons/go'

export const myObject = {
  type: 'object',
  name: 'myObject',
  title: 'My object',
  icon,
  // readOnly: true,
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'First',
    },
    {
      name: 'second',
      type: 'string',
      title: 'Second',
    },
  ],
}

export default {
  name: 'objectsTest',
  type: 'document',
  title: 'Objects test',
  // readOnly: true,
  preview: {
    select: {
      title: 'myObject.first',
    },
  },
  fieldsets: [{name: 'recursive', title: 'Recursive', options: {collapsable: true}}],
  fields: [
    {
      name: 'myObject',
      type: 'myObject',
      title: 'MyObject',
      description: 'The first field here should be the title',
    },
    {
      name: 'fieldWithObjectType',
      title: 'Field of object type',
      type: 'object',
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      // readOnly: true,
      // hidden: true,
      fields: [
        {
          name: 'field1',
          type: 'string',
          description: 'This is a string field',
          // readOnly: true,
        },
        {
          name: 'field2',
          type: 'myObject',
          title: 'A field of myObject 1',
          description: 'This is another field of "myObject"',
          readOnly: true,
        },
        {
          name: 'field3',
          type: 'myObject',
          title: 'A field of myObject 2',
          description: 'This is another field of "myObject"',
          hidden: ({parent}) => parent?.field1 === 'hide-field-3',
        },
      ],
    },
    {
      name: 'recursive',
      title: 'This field is of type objectsTest',
      type: 'objectsTest',
      fieldset: 'recursive',
    },
    {
      name: 'collapsibleObject',
      title: 'Collapsible object',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      description:
        'This is a field of (anonymous, inline) object type. Values here should never get a `_type` property',
      fields: [
        {name: 'field1', type: 'string', description: 'This is a string field'},
        {name: 'field2', type: 'string', description: 'This is a collapsed field'},
        {
          name: 'field3',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [
            {name: 'nested1', title: 'nested1', type: 'string'},
            {
              name: 'nested2',
              title: 'nested2',
              type: 'object',
              fields: [{name: 'ge', title: 'hello', type: 'string'}],
              options: {collapsible: true, collapsed: true},
            },
          ],
        },
      ],
    },
    {
      name: 'events',
      title: 'Events',
      type: 'array',
      of: [
        {
          name: 'mbwEvent',
          type: 'object',
          preview: {
            select: {
              where: 'where',
              what: 'what',
            },
            prepare({where, what}) {
              return {
                title: where,
                subtitle: (what || []).join(', '),
                media: () => (where || '').slice(0, 1),
              }
            },
          },
          fields: [
            {
              name: 'where',
              title: 'Where',
              description: 'Victoriagade? Baghaven? Koelschip?',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'what',
              title: 'What',
              description: 'Party? Bottle release? Tap takeover?',
              type: 'array',
              of: [{type: 'string'}],
              validation: (Rule) => Rule.min(1),
            },
          ],
        },
      ],
    },
  ],
}
