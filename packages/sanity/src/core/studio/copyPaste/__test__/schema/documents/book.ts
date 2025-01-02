import {defineType} from '@sanity/types'

export const bookDocument = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'publicationYear',
      title: 'Year of publication',
      type: 'number',
    },
  ],
})
