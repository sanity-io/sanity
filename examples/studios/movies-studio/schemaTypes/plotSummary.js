import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'plotSummary',
  title: 'Plot Summary',
  type: 'object',
  fields: [
    defineField({
      title: 'Summary',
      name: 'summary',
      type: 'text',
    }),
    defineField({
      title: 'Author',
      name: 'author',
      type: 'string',
    }),
    defineField({
      title: 'Link to author',
      name: 'url',
      type: 'url',
    }),
  ],
})
