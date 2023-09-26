import {defineType} from 'sanity'

export const commentsDebug = defineType({
  name: 'commentsDebug',
  type: 'document',
  title: 'Comments debug',
  fields: [
    {
      name: 'string',
      type: 'string',
      title: 'String title',
    },
    {
      name: 'hideImageField',
      type: 'boolean',
      title: 'Hide image field',
    },
    {
      name: 'image',
      type: 'image',
      title: 'Image title',
      hidden: ({document}) => Boolean(document?.hideImageField),
    },
    {
      type: 'array',
      name: 'arrayOfObjects',
      title: 'Array of objects title',
      of: [
        {
          name: 'firstObject',
          type: 'object',
          title: 'First object title',
          fields: [
            {
              name: 'string',
              type: 'string',
              title: 'String title',
            },
            {
              name: 'image',
              type: 'image',
              title: 'Image title',
              hidden: ({document}) => Boolean(document?.hideImageField),
            },
          ],
        },
      ],
    },
  ],
})
