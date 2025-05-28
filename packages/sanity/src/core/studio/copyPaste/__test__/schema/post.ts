import {defineType} from '@sanity/types'

export const postDocument = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'content',
      type: 'array',
      of: [{type: 'customNamedBlock'}],
    },
    {
      name: 'author',
      type: 'reference',
      to: [{type: 'author'}],
    },
  ],
})
