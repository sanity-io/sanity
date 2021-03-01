import {MdPerson as icon} from 'react-icons/md'
import AuthorPreview from '../parts/AuthorPreview'

export default {
  name: 'author',
  type: 'document',
  title: 'Author',
  icon,
  preview: {
    select: {
      title: 'name',
      awards: 'awards',
      relatedAuthors: 'relatedAuthors',
      imageUrl: 'image.asset.url',
      lastUpdated: '_updatedAt',
    },
    component: AuthorPreview,
  },
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'awards',
      title: 'Awards',
      type: 'array',
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'awesomeness',
      title: 'Awesomeness',
      type: 'number',
      options: {
        range: {min: 0, max: 10},
      },
    },
    {
      name: 'relatedAuthors',
      title: 'Related authors',
      type: 'array',
      options: {
        editModal: 'fold',
      },
      of: [
        {
          type: 'reference',
          to: {type: 'author'},
        },
      ],
    },
  ],
}
