import {UserIcon as icon} from '@sanity/icons'
import {type StringRule} from '@sanity/types'
import {defineField, defineType} from 'sanity'

// Example of how decision parameters can be accessed in a config context:
// In sanity.config.ts, you can define:
// [DECISION_PARAMETERS_SCHEMA]: {
//   audiences: ['aud-a', 'aud-b', 'aud-c'],
//   locales: ['en-GB', 'en-US'],
//   ages: ['20-29', '30-39']
// }
// Then access them via the ConfigContext in plugins, components, etc.

const AUTHOR_ROLES = [
  {value: 'developer', title: 'Developer'},
  {value: 'designer', title: 'Designer'},
  {value: 'ops', title: 'Operations'},
]

export const defineDecideField = (config: {name: string; title: string; type: 'string'}) => {
  return defineField({
    name: config.name,
    title: config.title,
    type: 'object',
    fields: [
      defineField({
        name: 'defaultValue',
        title: config.title,
        type: 'string',
      }),
      defineField({
        name: 'options',
        title: 'Options',
        type: 'array',
        of: [
          defineField({
            type: 'object',
            name: 'option',
            fields: [
              defineField({
                name: 'condition',
                title: 'Condition',
                type: 'string',
              }),
              defineField({
                name: 'value',
                title: 'Value',
                type: 'string',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export default defineType({
  name: 'author',
  type: 'document',
  title: 'Author',
  icon,
  description: 'This represents an author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      role: 'role',
      relatedAuthors: 'relatedAuthors',
      lastUpdated: '_updatedAt',
      media: 'image',
    },
    prepare({title, media, awards, role: roleName}: any) {
      const role = roleName ? AUTHOR_ROLES.find((option) => option.value === roleName) : undefined
      const awardsText = Array.isArray(awards) && awards.filter(Boolean).join(', ')

      return {
        title: typeof title === 'string' ? title : undefined,
        media: media as any,
        subtitle: [role?.title, awardsText].filter(Boolean).join(' · '),
      }
    },
  },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      options: {
        search: {weight: 100},
      },
      validation: (rule: StringRule) => rule.required(),
    }),
    defineDecideField({
      name: 'decideName',
      title: 'Decide Name',
      type: 'string',
    }),
    {
      name: 'bestFriend',
      title: 'Best friend',
      type: 'reference',
      to: [{type: 'author'}],
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: AUTHOR_ROLES,
      },
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'awards',
      title: 'Awards',
      type: 'array',
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'favoriteBooks',
      title: 'Favorite books',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'book'},
        },
      ],
    },
    {
      name: 'minimalBlock',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    },
    // {
    //   name: 'specie',
    //   title: 'Specie',
    //   description: 'There are a lot of species. Use this to test reference search performence',
    //   type: 'reference',
    //   to: {type: 'species'},
    // },
    {
      name: 'locked',
      title: 'Locked',
      description: 'Used for testing the "locked" permissions pattern',
      type: 'boolean',
    },
  ],

  initialValue: () => ({
    name: 'Foo',
    bestFriend: {_type: 'reference', _ref: 'foo-bar'},
    image: {
      _type: 'image',
      asset: {
        _ref: 'image-8dcc1391e06e4b4acbdc6bbf2e8c8588d537cbb8-4896x3264-jpg',
        _type: 'reference',
      },
    },
  }),
})
