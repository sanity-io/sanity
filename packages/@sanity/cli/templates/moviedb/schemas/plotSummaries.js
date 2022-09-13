import {defineField, defineType} from '@sanity/types'

export default defineType({
  title: 'Plot summaries',
  name: 'plotSummaries',
  type: 'object',
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'summaries',
      title: 'Summaries',
      type: 'array',
      of: [{type: 'plotSummary'}],
    }),
  ],
})
