export default {
  name: 'referenceTest',
  type: 'object',
  title: 'Reference Test',
  fields: [
    {name: 'title', type: 'string'},
    {name: 'selfRef', type: 'reference', to: {type: 'referenceTest'}},
    {
      name: 'arrayOfNamedReferences',
      type: 'array',
      of: [
        {
          type: 'reference',
          name: 'authorReference',
          to: [{type: 'author', title: 'Reference to author'}]
        },
        {
          type: 'reference',
          name: 'blogpostReference',
          to: [{type: 'blogpost', title: 'Reference to blog post'}]
        }
      ]
    }
  ]
}
