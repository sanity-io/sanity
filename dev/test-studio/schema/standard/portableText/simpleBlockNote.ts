import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'simpleBlockNote',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    defineField({
      name: 'minutes',
      type: 'number',
      title: 'Minutes',
      validation: (Rule) => Rule.max(45).warning('Are you sure you need this long?'),
    }),
    {
      name: 'notes',
      type: 'simpleBlockNoteBody',
      title: 'Notes',
    },
  ],
})
