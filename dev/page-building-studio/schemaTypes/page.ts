import {defineField, defineType} from 'sanity'

export const page = defineType({
  type: 'document',
  name: 'page',
  title: 'Page',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      of: [{type: 'hero'}, {type: 'logo-carousel'}, {type: 'testimonials'}],
    }),
  ],
})
