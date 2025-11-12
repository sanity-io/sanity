import {BookIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'book',
  type: 'document',
  title: 'Book',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    defineField({
      name: 'publicationYear',
      title: 'Publication Year',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorTitle: 'author.title',
      publicationYear: 'publicationYear',
    },
    prepare({title, authorTitle, publicationYear}) {
      return {
        title,
        subtitle: [
          authorTitle ? `By ${authorTitle}` : undefined,
          publicationYear ? `(${publicationYear})` : undefined,
        ]
          .filter(Boolean)
          .join(' '),
      }
    },
  },
})
