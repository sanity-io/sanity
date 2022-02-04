import {DocumentIcon, TagIcon} from '@sanity/icons'

export const schemaTypes = [
  {
    type: 'document',
    name: 'post',
    title: 'Post',
    icon: DocumentIcon,
    fields: [
      {
        type: 'string',
        name: 'title',
        title: 'Title',
      },
      {
        type: 'image',
        name: 'mainImage',
        title: 'Main image',
        options: {
          sources: ['my-unsplash'],
        },
      },
      {
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [{type: 'reference', name: 'tag', title: 'Tag', to: [{type: 'tag'}]}],
      },
    ],
  },

  {
    type: 'document',
    name: 'tag',
    title: 'Tag',
    icon: TagIcon,
    fields: [
      {
        type: 'string',
        name: 'title',
        title: 'Title',
      },
    ],
  },
]
