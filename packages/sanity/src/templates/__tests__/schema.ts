import SchemaBuilder from '@sanity/schema'
import {Schema} from '@sanity/types'

const Icon = () => null

export const schema = SchemaBuilder.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      icon: Icon,
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'role',
          type: 'string',
        },
      ],
      initialValue: () => ({
        role: 'Developer',
      }),
    },
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {
          name: 'street',
          type: 'string',
          initialValue: 'one old street',
        },
        {
          name: 'streetNo',
          type: 'string',
          initialValue: '123',
        },
      ],
    },
    {
      name: 'contact',
      title: 'Contact',
      type: 'object',
      fields: [
        {
          name: 'email',
          type: 'string',
        },
        {
          name: 'phone',
          type: 'string',
        },
      ],
    },
    {
      name: 'person',
      title: 'Person',
      type: 'document',
      icon: Icon,
      fields: [
        {
          name: 'address',
          type: 'address',
        },
        {
          name: 'contact',
          type: 'contact',
        },
      ],
    },

    {
      name: 'post',
      title: 'Post',
      type: 'document',
      icon: Icon,
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    },

    {
      name: 'captionedImage',
      type: 'object',
      fields: [
        {
          // This doesn't have a default value, so shouldn't be present,
          // not even with a `_type` stub
          name: 'asset',
          type: 'reference',
          to: [{type: 'sanity.imageAsset'}],
        },
        {
          name: 'caption',
          type: 'string',
        },
      ],
      initialValue: {caption: 'Default caption!'},
    },

    {
      name: 'recursiveObject',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'child',
          type: 'recursiveObject',
        },
      ],
      initialValue: {
        name: '∞ recursion is ∞',
      },
    },

    {
      name: 'developer',
      type: 'document',
      initialValue: () => ({
        name: 'A default name!',

        // Should clear the default value below (but ideally not actually be part
        // of the value, eg no `undefined` in the resolved value)
        numberOfCats: undefined,
      }),
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'hasPet',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'age',
          type: 'number',
          initialValue: 30,
        },
        {
          name: 'numberOfCats',
          type: 'number',
          initialValue: 3,
        },
        {
          name: 'heroImage',
          type: 'captionedImage',
        },
        {
          name: 'awards',
          type: 'array',
          of: [{type: 'string'}],
          initialValue: () => ['TypeScript Wizard of the Year'],
        },
        {
          name: 'tasks',
          type: 'array',
          of: [
            {
              name: 'task',
              type: 'object',
              fields: [
                {name: 'description', type: 'string'},
                {name: 'isDone', type: 'boolean', initialValue: false},
              ],
            },
          ],
          initialValue: () => [
            {
              _type: 'task',
              description: 'Mark as done',
              isDone: false,
            },
          ],
        },
        {
          name: 'recursive',
          type: 'recursiveObject',
          // Initial value set on it's actual type
        },
      ],
    },
  ],
}) as Schema
