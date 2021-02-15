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
      name: 'homeAddress',
      title: 'Home Address',
      type: 'address',
    },
  ],

  initialValue: () => ({
    name: 'Foo',
    // address: undefined,
  }),
}
