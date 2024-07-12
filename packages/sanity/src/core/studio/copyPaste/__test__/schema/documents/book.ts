import {defineType} from 'sanity'

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
