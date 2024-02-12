import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dateTimeValidation',
  type: 'document',
  fields: [
    defineField({
      name: 'requiredDatetime',
      type: 'datetime',
      validation: (Rule) => Rule.min('2024-01-01 00:00').required(),
    }),
  ],
})
