export default {
  name: 'referenceTest',
  type: 'document',
  title: 'Reference test',
  description: 'Test cases for references',
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
      name: 'array',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'author'}
        }
      ]
    }
  ]
}
