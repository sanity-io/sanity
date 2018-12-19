import icon from 'react-icons/lib/md/person'

export default {
  name: 'author',
  type: 'document',
  title: 'Author',
  icon,
  description: 'This represents an author',
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      lastUpdated: '_updatedAt',
      media: 'image'
    },
    prepare({title, media, awards}) {
      return {
        title: title,
        media: media,
        subtitle: awards && awards.join(', ')
      }
    }
  },
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'bestFriend',
      title: 'Best friend',
      type: 'reference',
      to: [{type: 'author'}]
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}
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
      name: 'favoriteBooks',
      title: 'Favorite books',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'book'}
        }
      ]
    },
    {
      name: 'minimalBlock',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: []
          }
        }
      ]
    },
    {
      name: 'specie',
      title: 'Specie',
      description: 'There are a lot of species. Use this to test reference search performence',
      type: 'reference',
      to: {type: 'species'}
    }
  ]
}
