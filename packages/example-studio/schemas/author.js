export default {
  name: 'author',
  type: 'object',
  title: 'Author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      imageUrl: 'image.asset.url'
    },
    prepare(value) {
      return Object.assign({}, value, {
        subtitle: `${value.awards.length} awards`,
        description: `Related authors: ${value.relatedAuthors.length}`
      })
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
