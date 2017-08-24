export default {
  name: 'author',
  type: 'object',
  title: 'Author',
  description: 'This represents an author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      imageUrl: 'image.asset.url',
      lastUpdated: '_updatedAt'
    }
  },
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
    }
  ]
}
