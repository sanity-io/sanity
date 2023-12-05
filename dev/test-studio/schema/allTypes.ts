import {defineField, defineType} from 'sanity'

export const allTypes = defineType({
  name: 'allTypes',
  title: 'All schema types',
  type: 'document',
  fields: [
    defineField({
      name: 'string',
      title: 'Strengfelt',
      type: 'string',
      description: 'Påbudt. Må være i store bokstaver..',
      validation: (Rule) =>
        Rule.required().uppercase().error({
          'en-US': 'Dude, UPPERCASE!',
          'no-NB': 'Dude, STORE BOKSTAVER!',
        }),
    }),
    defineField({
      name: 'type',
      type: 'string',
      title: 'Type',
      description: 'Påbudt. Må være en av verdiene her.',
      initialValue: 'foo',
      validation: (Rule) => Rule.required(),
      options: {list: ['Frukt', 'Dyr', 'Fjell']},
    }),
    defineField({
      name: 'number',
      title: 'Nummer',
      type: 'number',
      description: 'Påbudt. Må være mellom 5 og 10.',
      validation: (Rule) => Rule.required().min(5).max(10),
    }),
    defineField({
      name: 'boolean',
      title: 'Ja eller nei',
      type: 'boolean',
      description: 'Påbudt.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'array',
      title: 'Liste',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Påbudt. Må ha minste 2 unike ting i seg.',
      validation: (Rule) => Rule.required().min(2).unique(),
    }),
    defineField({
      name: 'object',
      title: 'Objekt',
      type: 'object',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'email',
          title: 'Epost',
          type: 'email',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'reference',
      title: 'Referanse',
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
      name: 'cdReference',
      title: 'Referanse på tvers av datasett',
      type: 'crossDatasetReference',
      dataset: 'blog',
      to: [{type: 'author', preview: {select: {title: 'name'}}}],
    }),
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      validation: (Rule) => Rule.assetRequired(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternativ tekst',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'file',
      title: 'Fil',
      type: 'file',
      validation: (Rule) => Rule.assetRequired(),
      fields: [
        defineField({
          name: 'description',
          title: 'Beskrivelse',
          type: 'string',
          validation: (Rule) => Rule.required().lowercase(),
        }),
      ],
    }),
    defineField({
      name: 'date',
      title: 'Dato',
      type: 'date',
      validation: (Rule) => Rule.required().min('2023-01-01'),
    }),
    defineField({
      name: 'datetime',
      title: 'Dato/klokkeslett',
      type: 'datetime',
      validation: (Rule) => Rule.required().min('2023-06-03T13:00:00Z'),
    }),
    defineField({
      name: 'geopoint',
      title: 'Lokasjon',
      type: 'geopoint',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'slug',
      title: 'Snegle (fnis)',
      type: 'slug',
      options: {source: 'string'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Tekst',
      type: 'text',
      validation: (Rule) =>
        Rule.required().regex(/^[a-z]+\d$/, {name: 'All lowercase, ends with a digit'}),
    }),
    defineField({
      name: 'blocks',
      title: 'Blokker',
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}],
      validation: (Rule) => Rule.required().min(3),
    }),
  ],
  preview: {
    select: {
      title: 'string',
    },
  },
})
