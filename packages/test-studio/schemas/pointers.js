export default [
  {
    type: 'object',
    name: 'pointer',
    fields: [
      {
        name: 'path',
        type: 'string',
      },
      {
        name: 'document', type: 'reference', to: [{type: 'book'}]
      }
    ]
  },
  {
    name: 'pointersTest',
    type: 'document',
    title: 'Pointers',
    description: 'Test pointers',
    fields: [
      {
        name: 'name',
        title: 'Name',
        type: 'string'
      },
      {
        name: 'book',
        title: 'Book pointer',
        type: 'pointer'
      }
    ]
  }
]
