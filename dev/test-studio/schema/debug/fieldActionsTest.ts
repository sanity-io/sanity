import {defineType} from 'sanity'

export const fieldActionsTest = defineType({
  type: 'document',
  name: 'fieldActionsTest',
  title: 'Field Actions Test',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'slug',
      name: 'slug',
      title: 'Slug',
    },
    {
      type: 'array',
      name: 'tags',
      title: 'Tags',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    },
    {
      type: 'array',
      name: 'favoriteBooks',
      title: 'Favorite books',
      of: [{type: 'reference', to: {type: 'book'}}],
    },
    {
      type: 'object',
      name: 'meta',
      title: 'Meta',
      fields: [
        {
          type: 'string',
          name: 'title',
          title: 'Title',
        },
        {
          type: 'text',
          name: 'description',
          title: 'Description',
        },
      ],
    },
  ],
})
