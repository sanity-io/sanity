import icon from 'part:@sanity/base/user-icon'

export default {
  name: 'author',
  type: 'document',
  title: 'Author',
  icon,
  description: 'This represents an author',
  __experimental_search: [{path: 'name', weight: 10}],
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      lastUpdated: '_updatedAt',
      media: 'image',
    },
    prepare({title, media, awards}) {
      return {
        title: title,
        media: media,
        subtitle: awards && awards.join(', '),
      }
    },
  },
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
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
        list: [
          {value: 'developer', title: 'Developer'},
          {value: 'designer', title: 'Designer'},
          {value: 'ops', title: 'Operations'},
        ],
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
    {
      name: 'specie',
      title: 'Specie',
      description: 'There are a lot of species. Use this to test reference search performence',
      type: 'reference',
      to: {type: 'species'},
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
}
