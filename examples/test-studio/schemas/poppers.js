export default {
  type: 'document',
  name: 'poppers',
  title: 'Poppers',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'array',
      name: 'objectsWithReference',
      title: 'Objects with reference',
      of: [
        {
          type: 'object',
          name: 'objectWithReference',
          title: 'Object with reference',
          fields: [
            {type: 'string', name: 'title', title: 'Title'},
            {type: 'text', name: 'description', title: 'Description', rows: 20},
            {type: 'reference', name: 'reference', title: 'Reference', to: [{type: 'book'}]},
          ],
        },
      ],
    },
  ],
}
