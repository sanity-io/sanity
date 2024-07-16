import {UserIcon as icon} from '@sanity/icons'
import {defineField, defineType, type Rule} from 'sanity'

const AUTHOR_ROLES = [
  {value: 'developer', title: 'Developer'},
  {value: 'designer', title: 'Designer'},
  {value: 'ops', title: 'Operations'},
]

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
      validation: (rule: Rule) => rule.required(),
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
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {
          name: 'street',
          title: 'Street',
          type: 'string',
        },
        {
          name: 'zip',
          title: 'Zip',
          type: 'string',
        },
      ],
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
