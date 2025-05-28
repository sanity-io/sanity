import {defineType} from '@sanity/types'

export const authorDocument = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'uniqueStringNotInOtherDocument',
      type: 'string',
    },
    {
      name: 'isVerified',
      type: 'boolean',
    },
    {
      name: 'born',
      type: 'number',
    },
    {
      name: 'favoriteNumbers',
      type: 'array',
      of: [{type: 'number'}],
    },
    {
      name: 'testNumberWithListObjects',
      title: 'Test Number - List Objects',
      type: 'number',
      options: {
        list: [
          {value: 1, title: 'One'},
          {value: 2, title: 'Two'},
        ],
      },
    },
    {type: 'image', name: 'profileImage'},
    {
      type: 'object',
      name: 'socialLinks',
      fields: [
        {type: 'string', name: 'twitter'},
        {type: 'string', name: 'linkedin'},
      ],
    },
    {
      name: 'nestedTest',
      type: 'nestedObject',
    },
    {
      name: 'bio',
      type: 'array',
      of: [
        {type: 'customNamedBlock'},
        {type: 'myStringObject'},
        {type: 'reference', to: [{type: 'author'}]},
      ],
    },
    {
      name: 'friends',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'author'}]}],
    },
    {
      name: 'bestFriend',
      type: 'reference',
      weak: true,
      to: [{type: 'author'}],
    },
  ],
})
