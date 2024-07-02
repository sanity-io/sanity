import {defineField, defineType} from 'sanity'

import {eventsArray} from '../objects'

export const referencesDocument = defineType({
  name: 'referencesDocument',
  title: 'References',
  type: 'document',
  fields: [
    eventsArray,
    defineField({
      name: 'arrayOfReferences',
      title: 'Array of references to authors',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'editor'}]}],
    }),
  ],
})
