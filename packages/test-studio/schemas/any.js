export default {
  name: 'anyTest',
  type: 'object',
  title: 'Any fields test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'authorOrImage',
      title: 'Anything',
      type: 'any',
      of: [{type: 'author', title: 'Author'}, {type: 'image', title: 'Image'}]
    }
  ]
}
