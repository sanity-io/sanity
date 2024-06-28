import {defineType} from 'sanity'

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
})
