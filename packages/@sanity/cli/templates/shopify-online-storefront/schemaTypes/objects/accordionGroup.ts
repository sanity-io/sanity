import {defineField, defineType} from 'sanity'
import {toPlainText} from '@portabletext/toolkit'

export default defineType({
  name: 'accordionGroup',
  title: 'Group',
  type: 'object',
  icon: false,
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
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      body: 'body',
      title: 'title',
    },
    prepare(selection) {
      const {body, title} = selection
      return {
        subtitle: body && toPlainText(body),
        title,
      }
    },
  },
})
