import icon from 'react-icons/lib/fa/recycle'

export default {
  name: 'referenceTest',
  type: 'document',
  title: 'Reference test',
  description: 'Test cases for references',
  icon,
  fields: [
    {name: 'title', type: 'string'},
    {name: 'selfRef', type: 'reference', to: {type: 'referenceTest'}},
    {
      name: 'refToTypeWithNoToplevelStrings',
      type: 'reference',
      to: {type: 'typeWithNoToplevelStrings'}
    },
    {
      name: 'someWeakRef',
      type: 'reference',
      weak: true,
      to: {type: 'author'}
    },
    {
      title: 'Reference to book or author',
      name: 'multiTypeRef',
      type: 'reference',
      to: [{type: 'book'}, {type: 'author'}]
    },
    {
      name: 'array',
      type: 'array',
      of: [
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'}
        },
        {
          type: 'reference',
          name: 'weakAuthorRef',
          title: 'A weak author ref',
          weak: true,
          to: {type: 'author'},
        }
      ]
    },
  ],
  preview: {
    fields: {
      title: 'title',
      author0: 'array.0.name',
      author1: 'array.1.name'
    },
    prepare(val) {
      return {
        title: val.title,
        subtitle: [val.author0, val.author1].filter(Boolean).join(', ')
      }
    }
  }
}
