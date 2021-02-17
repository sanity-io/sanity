import icon from 'part:@sanity/base/user-icon'

export default {
  name: 'person',
  type: 'document',
  title: 'Person',
  icon,
  description: 'This represents an person',
  // eslint-disable-next-line camelcase
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
      name: 'bestFriend',
      title: 'Best friend',
      type: 'reference',
      to: [{type: 'author'}],
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
      name: 'address',
      title: 'Address',
      type: 'address',
    },
    {
      title: 'My Addresses',
      name: 'myAddresses',
      type: 'array',
      of: [{type: 'address'}],
    },
  ],

  initialValue: () => ({
    name: 'Foo',
    bestFriend: {_type: 'reference', _ref: 'foo-bar'},
    favoriteBooks: [
      {
        _ref: 'e5f87fcd-1e32-4a99-ab20-65f80a5c7c28',
        _type: 'reference',
      },
    ],
    myAddresses: [
      {
        _type: 'address',
        city: 'New York',
      },
    ],
  }),
}
