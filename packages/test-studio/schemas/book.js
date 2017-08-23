export default {
  name: 'book',
  type: 'object',
  title: 'Book',
  description: 'This is just a simple type for generating some test data',
  preview: {
    select: {
      title: 'title',
      createdAt: '_createdAt',
      lead: 'lead',
      imageUrl: 'mainImage.asset.url',
      author: 'authorRef.name'
    }
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author', title: 'Author'}
    }
  ]
}
