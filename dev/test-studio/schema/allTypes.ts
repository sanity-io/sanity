import {ComponentIcon, DotIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const allTypes = defineType({
  name: 'allTypes',
  title: 'All schema types',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      icon: DotIcon,
      name: 'string',
      title: 'Text field',
      type: 'string',
      description: 'Påbudt. Må være i store bokstaver..',
      validation: (Rule) =>
        Rule.required().uppercase().error({
          'en-US': 'Dude, UPPERCASE!',
          'no-NB': 'Dude, STORE BOKSTAVER!',
        }),
      initialValue: 'BARRRR',
    }),
    defineField({
      icon: DotIcon,
      name: 'type',
      type: 'string',
      title: 'Type',
      description: 'Påbudt. Må være en av verdiene her.',
      initialValue: 'Frukt',
      validation: (Rule) => Rule.required(),
      options: {list: ['Frukt', 'Dyr', 'Fjell']},
    }),
    defineField({
      icon: DotIcon,
      name: 'number',
      title: 'Number',
      type: 'number',
      description: 'Påbudt. Må være mellom 5 og 10.',
      initialValue: 7,
      validation: (Rule) => Rule.required().min(5).max(10),
    }),
    defineField({
      icon: DotIcon,
      name: 'boolean',
      title: 'Yes or no',
      type: 'boolean',
      description: 'Påbudt.',
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      icon: DotIcon,
      name: 'array',
      title: 'List',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Påbudt. Må ha minste 2 unike ting i seg.',
      initialValue: ['Item 1', 'Item 2'],
      validation: (Rule) => Rule.required().min(2).unique(),
    }),
    defineField({
      icon: DotIcon,
      name: 'tagsArray',
      title: 'Tags list',
      description: 'Påbudt. Må ha minste 2 unike ting i seg.',
      type: 'array',
      of: [{type: 'string'}],
      initialValue: ['Tag 1', 'Tag 2'],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      icon: DotIcon,
      name: 'object',
      title: 'Object',
      type: 'object',
      description: 'Påbudt. Et objekt med en e-postadresse.',
      initialValue: {
        email: 'example@example.com',
      },
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          icon: DotIcon,
          name: 'email',
          title: 'Email',
          type: 'email',
          description: 'Påbudt e-postadresse.',
          initialValue: 'example@example.com',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      icon: DotIcon,
      name: 'reference',
      title: 'Reference',
      type: 'reference',
      description:
        'Påbudt. Referanse til forfatter eller bok. Ikke tillatt å referere til George R. R. Martin.',
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
      icon: DotIcon,
      name: 'cdReference',
      title: 'Cross-dataset reference',
      type: 'crossDatasetReference',
      description: 'Referanse til en forfatter i blogg-datasettet.',
      dataset: 'blog',
      to: [{type: 'author', preview: {select: {title: 'name'}}}],
    }),
    defineField({
      icon: DotIcon,
      name: 'globalReference',
      title: 'Global reference',
      type: 'globalDocumentReference',
      description: 'Global referanse til en forfatter i en annen dataset.',
      resourceType: 'dataset',
      resourceId: 'ppsg7ml5.playground',
      to: [{type: 'author', preview: {select: {title: 'name'}}}],
    }),
    defineField({
      icon: DotIcon,
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Påbudt. Et bilde med alternativ tekst.',
      validation: (Rule) => Rule.required().assetRequired(),
      fields: [
        defineField({
          icon: DotIcon,
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Påbudt alternativ tekst for bildet.',
          initialValue: 'Image description',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      icon: DotIcon,
      name: 'imageNoMetadata',
      title: 'Image without metadata',
      type: 'image',
      options: {
        metadata: [],
        hotspot: false,
      },
      description: 'Påbudt. Et bilde med alternativ tekst.',
      validation: (Rule) => Rule.required().assetRequired(),
      fields: [
        defineField({
          icon: DotIcon,
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Påbudt alternativ tekst for bildet.',
          initialValue: 'Image description',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      icon: DotIcon,
      name: 'file',
      title: 'File',
      type: 'file',
      description: 'Påbudt. En fil med beskrivelse.',
      validation: (Rule) => Rule.required().assetRequired(),
      fields: [
        defineField({
          icon: DotIcon,
          name: 'description',
          title: 'Description',
          type: 'string',
          description: 'Påbudt beskrivelse. Må være i små bokstaver.',
          initialValue: 'file description',
          validation: (Rule) => Rule.required().lowercase(),
        }),
      ],
    }),
    defineField({
      icon: DotIcon,
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'Påbudt. Må være etter 1. januar 2023.',
      initialValue: '2023-06-15',
      validation: (Rule) => Rule.required().min('2023-01-01'),
    }),
    defineField({
      icon: DotIcon,
      name: 'datetime',
      title: 'Date and time',
      type: 'datetime',
      description: 'Påbudt. Må være etter 3. juni 2023, klokken 13:00 UTC.',
      initialValue: '2023-06-15T15:00:00Z',
      validation: (Rule) => Rule.required().min('2023-06-03T13:00:00Z'),
    }),
    defineField({
      icon: DotIcon,
      name: 'geopoint',
      title: 'Location',
      type: 'geopoint',
      description: 'Påbudt. Et geografisk punkt med lengde- og breddegrad.',
      initialValue: {
        lat: 59.9139,
        lng: 10.7522,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      icon: DotIcon,
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Påbudt. Må være en HTTPS-URL.',
      initialValue: 'https://sanity.io',
      validation: (Rule) => Rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      icon: DotIcon,
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Påbudt. En slug basert på tekst-feltet.',
      options: {source: 'string'},
      initialValue: {
        current: 'foo',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      icon: DotIcon,
      name: 'text',
      title: 'Text',
      type: 'text',
      description: 'Påbudt. Må være i små bokstaver og avsluttes med et tall.',
      initialValue: 'example5',
      validation: (Rule) =>
        Rule.required().regex(/^[a-z]+\d$/, {name: 'All lowercase, ends with a digit'}),
    }),
    defineField({
      icon: DotIcon,
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      description: 'Påbudt. Må ha minst 3 blokker.',
      initialValue: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Block 1',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Block 2',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: 'Block 3',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      of: [defineArrayMember({type: 'block'}), defineArrayMember({type: 'image'})],
      validation: (Rule) => Rule.required().min(3),
    }),
    defineField({
      icon: DotIcon,
      name: 'email',
      title: 'Email',
      type: 'email',
      description: 'Påbudt. Må være en gyldig e-postadresse.',
      initialValue: 'test@example.com',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      icon: DotIcon,
      name: 'myArray',
      type: 'array',
      title: 'My Array',
      description: 'En array av objekter med string-felt.',
      initialValue: [
        {
          _type: 'myObject',
          myString: 'Example string',
        },
      ],
      of: [
        defineArrayMember({
          type: 'object',
          name: 'myObject',
          fields: [
            defineField({
              icon: DotIcon,
              type: 'string',
              name: 'myString',
              title: 'My string',
              description: 'Et tekstfelt i objektet.',
              initialValue: 'Example string',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'string',
    },
  },
  initialValue: {
    string: 'FOO',
  },
})
