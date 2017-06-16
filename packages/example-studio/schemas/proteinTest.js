export default {
  name: 'proteinTest',
  type: 'object',
  title: 'Protein test document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'protein',
      title: 'Protein',
      type: 'protein'
    },
    {
      name: 'proteins',
      title: 'Array of proteins',
      type: 'array',
      of: [{type: 'protein'}]
    }
  ]
}
