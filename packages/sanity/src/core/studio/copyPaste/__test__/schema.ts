import {Schema as SchemaBuilder} from '@sanity/schema'
import {defineType, type Schema} from '@sanity/types'

const Icon = () => null

const linkType = defineType({
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    },
  ],
  validation: (Rule) => Rule.required(),
})

const myStringType = defineType({
  type: 'object',
  name: 'test',
  fields: [{type: 'string', name: 'mystring', validation: (Rule) => Rule.required()}],
})

export const schema = SchemaBuilder.compile({
  name: 'default',
  types: [
    linkType,
    myStringType,
    {
      name: 'customNamedBlock',
      type: 'block',
      title: 'A named custom block',
      marks: {
        annotations: [linkType, myStringType],
      },
      of: [
        {type: 'image'},
        {
          type: 'object',
          name: 'test',
          fields: [myStringType],
        },
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'},
        },
      ],
    },
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
        {
          name: 'bio',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'bestFriend',
          type: 'reference',
          to: [{type: 'author'}],
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
        {
          name: 'body',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
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
