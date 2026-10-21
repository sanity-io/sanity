import {defineType} from 'sanity'

import {bookFields} from './books'

// E9 fixtures (seed/seed-e9.mts). Two document types, so the Book list and its checks stay as they were.
//  - e9Set: the review list. Ten documents with a Returning visitors variant (seven differ from the base, three are the same as it)
//    and three without a variant for that perspective: "Returning visitors against Base · 7 of 10 differ".
//  - e9Case: named scenarios (draft and published of one variant, a variant that is only published, a document with no de-DE version).
export const e9Set = defineType({
  name: 'e9Set',
  title: 'E9 review set',
  type: 'document',
  fields: bookFields,
  preview: {select: {title: 'title', subtitle: 'subtitle'}},
})

export const e9Case = defineType({
  name: 'e9Case',
  title: 'E9 scenarios',
  type: 'document',
  fields: bookFields,
  preview: {select: {title: 'title', subtitle: 'subtitle'}},
})

export const e9Types = [e9Set, e9Case]
