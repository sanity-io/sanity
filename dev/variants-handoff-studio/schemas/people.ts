import {defineArrayMember, defineField, defineType} from 'sanity'

import {languageField} from './language'

// Referenced types for the E9 multi-pane scenarios (seed/seed-refs.mts): books point at authors, publishers, series and places with real
// references, hard and weak, in a field, in an array and inline in portable text. Some of the referenced documents have variants.

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'bio', type: 'text', rows: 3}),
    defineField({name: 'born', type: 'number'}),
    defineField({name: 'homeTown', type: 'reference', to: [{type: 'place'}], weak: true}),
  ],
  preview: {select: {title: 'name', subtitle: 'bio'}},
})

export const publisher = defineType({
  name: 'publisher',
  title: 'Publisher',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'about', type: 'text', rows: 2}),
    defineField({name: 'headquarters', type: 'reference', to: [{type: 'place'}]}),
    languageField,
  ],
  preview: {select: {title: 'name', subtitle: 'about'}},
})

export const series = defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'blurb', type: 'text', rows: 2}),
    languageField,
  ],
  preview: {select: {title: 'title', subtitle: 'blurb'}},
})

export const place = defineType({
  name: 'place',
  title: 'Place',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'country', type: 'string'}),
    languageField,
  ],
  preview: {select: {title: 'name', subtitle: 'country'}},
})

/** Fields added to the book types: a hard reference, a weak one, a hard one to a series, an array of mixed references, portable text with an inline reference. */
export const referenceFields = [
  defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
  defineField({name: 'publisher', type: 'reference', to: [{type: 'publisher'}], weak: true}),
  defineField({name: 'inSeries', type: 'reference', to: [{type: 'series'}]}),
  defineField({
    name: 'relatedBooks',
    type: 'array',
    of: [
      defineArrayMember({type: 'reference', name: 'related', to: [{type: 'book'}]}),
      defineArrayMember({
        type: 'reference',
        name: 'relatedWeak',
        title: 'Related (weak)',
        to: [{type: 'book'}],
        weak: true,
      }),
    ],
  }),
  defineField({
    name: 'notes',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        of: [
          defineArrayMember({
            type: 'reference',
            name: 'authorMention',
            title: 'Author mention',
            to: [{type: 'author'}],
          }),
        ],
      }),
    ],
  }),
]

export const peopleTypes = [author, publisher, series, place]
