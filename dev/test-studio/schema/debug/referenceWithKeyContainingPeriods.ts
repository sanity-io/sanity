import {defineType, defineField} from 'sanity'

export const referenceWithKeyContainingPeriods = defineType({
  name: 'referenceWithKeyContainingPeriods',
  title: 'Reference With Key Containing Periods',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'authors',
      type: 'array' as const,
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'author',
            },
          ],
        },
      ],
    }),
  ],
})
