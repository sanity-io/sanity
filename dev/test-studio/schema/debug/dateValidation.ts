import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dateValidation',
  type: 'document',
  fields: [
    defineField({
      name: 'requiredDate',
      type: 'date',
      validation: (Rule) => Rule.min('2024-01-01').required(),
    }),
  ],
})
