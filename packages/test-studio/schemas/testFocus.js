export default {
  name: 'focusTest',
  type: 'document',
  title: 'Focus test',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'someArray',
      type: 'array',
      title: 'An object',
      of: [
        {
          type: 'object',
          fields: [{name: 'first', type: 'string'}]
        }
      ],
    },
    {
      name: 'someObject',
      type: 'object',
      title: 'An object',
      fields: [{name: 'first', type: 'string'}]
    }
  ]
}
