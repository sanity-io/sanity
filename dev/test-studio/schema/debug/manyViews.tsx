import {defineField, defineType} from 'sanity'

export const manyViewsType = defineType({
  type: 'document',
  name: 'manyViews',
  title: 'Many views',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
  ],
})
