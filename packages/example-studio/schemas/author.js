import AuthorPreview from '../parts/AuthorPreview'

export default {
  name: 'author',
  type: 'object',
  title: 'Author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      imageUrl: 'image.asset.url',
      lastUpdated: '_updatedAt'
    },
    component: AuthorPreview
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
