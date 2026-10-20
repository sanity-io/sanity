import {defineField, defineType} from 'sanity'

// Nordic Books: the mock catalogue behind the Variants 2.0 fixtures (seed/nordic-books.json).
const fields = [
  defineField({name: 'title', type: 'string'}),
  defineField({name: 'subtitle', type: 'string'}),
  defineField({name: 'blurb', type: 'text', rows: 3}),
  // Added with the real seed content (seed/variant-content.json): what a personalised version changes.
  defineField({name: 'highlights', type: 'array', of: [{type: 'string'}]}),
  defineField({name: 'promo', type: 'string', description: 'The strip above the book'}),
  defineField({name: 'badge', type: 'string', description: 'A small chip'}),
  defineField({name: 'cta', type: 'string', title: 'Button label'}),
]

export const book = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields,
  preview: {select: {title: 'title', subtitle: 'subtitle'}},
})

// Live edit: no drafts, only published (the "liveEdit" world in the fixtures).
export const bookLive = defineType({
  name: 'bookLive',
  title: 'Book (live edit)',
  type: 'document',
  liveEdit: true,
  fields,
  preview: {select: {title: 'title', subtitle: 'subtitle'}},
})

export const bookTypes = [book, bookLive]
