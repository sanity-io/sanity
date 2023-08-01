import {defineField, defineType} from 'sanity'

export const allTypes = defineType({
  name: 'allTypes',
  title: 'All schema types',
  type: 'document',
  fields: [
    defineField({
      name: 'string',
      type: 'string',
      description: 'Required. Must be uppercase.',
      validation: (Rule) =>
        Rule.required().uppercase().error({
          'en-US': 'Dude, UPPERCASE!',
          'no-NB': 'Dude, STORE BOKSTAVER!',
        }),
    }),
    defineField({
      name: 'type',
      type: 'string',
      description: 'Required. Must be one of the values.',
      initialValue: 'foo',
      validation: (Rule) => Rule.required(),
      options: {list: ['Fruit', 'Animal', 'Mountain']},
    }),
    defineField({
      name: 'number',
      type: 'number',
      description: 'Required. Must be between 5 and 10.',
      validation: (Rule) => Rule.required().min(5).max(10),
    }),
    defineField({
      name: 'boolean',
      type: 'boolean',
      description: 'Required.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'array',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Required. Must have at least 2 unique items.',
      validation: (Rule) => Rule.required().min(2).unique(),
    }),
    defineField({
      name: 'object',
      type: 'object',
      validation: (Rule) => Rule.required(),
      fields: [defineField({name: 'email', type: 'email', validation: (Rule) => Rule.required()})],
    }),
    defineField({
      name: 'reference',
      type: 'reference',
      to: [{type: 'author'}, {type: 'book'}],
      validation: (Rule) =>
        Rule.required().custom((ref, context) => {
          if (ref?._ref.includes('grrm')) {
            return context.i18n.t('validation:anyone-but-grrm')
          }
          return true
        }),
    }),
    defineField({
      name: 'image',
      type: 'image',
      validation: (Rule) => Rule.required().assetRequired(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'file',
      type: 'file',
      validation: (Rule) => Rule.required().assetRequired(),
      fields: [
        defineField({
          name: 'description',
          type: 'string',
          validation: (Rule) => Rule.required().lowercase(),
        }),
      ],
    }),
    defineField({
      name: 'date',
      type: 'date',
      validation: (Rule) => Rule.required().min('2023-01-01'),
    }),
    defineField({
      name: 'datetime',
      type: 'datetime',
      validation: (Rule) => Rule.required().min('2023-06-03T13:00:00Z'),
    }),
    defineField({
      name: 'geopoint',
      type: 'geopoint',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      type: 'url',
      validation: (Rule) => Rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'string'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      type: 'text',
      validation: (Rule) =>
        Rule.required().regex(/^[a-z]+\d$/, {name: 'All lowercase, ends with a digit'}),
    }),
    defineField({
      name: 'blocks',
      type: 'array',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required().min(3),
    }),
  ],
  preview: {
    select: {
      title: 'string',
    },
  },
})
