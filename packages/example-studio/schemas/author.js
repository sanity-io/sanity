export default {
  name: 'author',
  type: 'object',
  title: 'Author',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image'
    },
    {
      name: 'awards',
      title: 'Awards',
      type: 'array',
      of: [
        {
          type: 'string'
        }
      ]
    },
    {
      name: 'relatedAuthors',
      title: 'Related authors',
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
