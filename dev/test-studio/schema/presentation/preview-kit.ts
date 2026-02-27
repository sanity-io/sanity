import {defineField, defineType} from 'sanity'

export const types = [
  defineType({
    name: 'page',
    title: 'Page',
    type: 'document' as const,
    fields: [
      defineField({
        name: 'title',
        type: 'string',
      }),
    ],
  }),
]
