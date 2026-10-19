import {defineField, defineType} from 'sanity'

// Nordic Books: the mock catalogue behind the Variants 2.0 fixtures
// (docs/initiatives/curation-perspective-selector/fixtures/documents.json).
const fields = [
  defineField({name: 'title', type: 'string'}),
  defineField({name: 'subtitle', type: 'string'}),
  defineField({name: 'blurb', type: 'text', rows: 3}),
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
