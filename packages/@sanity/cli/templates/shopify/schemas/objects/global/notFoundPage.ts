import {defineField} from 'sanity'

export default defineField({
  name: 'notFoundPage',
  title: '404 page',
  type: 'object',
  group: 'notFoundPage',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      description: 'Collection products displayed on this page',
      weak: true,
      to: [
        {
          name: 'collection',
          type: 'collection',
        },
      ],
    }),
    // Color theme
    defineField({
      name: 'colorTheme',
      title: 'Color theme',
      type: 'reference',
      to: [{type: 'colorTheme'}],
    }),
  ],
})
