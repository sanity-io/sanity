import {defineField, defineType} from 'sanity'

export const documentInternationalizationTest = defineType({
  type: 'document',
  name: 'documentI18nTest',
  title: 'Document Internationalization Test',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      title: 'Excerpt',
      rows: 3,
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: [{type: 'block'}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
    },
    prepare({title, language}) {
      return {
        title: title || 'Untitled',
        subtitle: language ? `Language: ${language}` : undefined,
      }
    },
  },
})
