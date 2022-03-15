const rnd = Math.random()

export default {
  name: 'invalidPreviews',
  type: 'document',
  title: 'Preview: Invalid preview configs',
  preview: {
    select: {
      title: 'title',
      media: 'array',
    },
    prepare(invalue) {
      if (rnd < 0.2) {
        throw new Error('nope')
      }
      if (rnd < 0.4) {
        return null
      }
      if (rnd < 0.6) {
        return 'WILLNOTWORK'
      }
      if (rnd < 0.8) {
        return {title: new Date()}
      }
      return invalue
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        {name: 'en', type: 'string', title: 'English'},
        {name: 'no', type: 'string', title: 'Norwegian'},
      ],
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'array',
      type: 'array',
      title: 'Array',
      of: [
        {
          type: 'object',
          name: 'customObjectWithInvalidPreview',
          fields: [
            {
              name: 'objectWithInvalidPreview',
              title: 'Title',
              type: 'object',
              fields: [
                {
                  name: 'someObj',
                  type: 'object',
                  title: 'Object',
                  fields: [{name: 'someString', type: 'string'}],
                },
              ],
              preview: {
                select: {title: 'objectWithInvalidPreview'},
              },
            },
          ],
          preview: {
            select: {title: 'objectWithInvalidPreview'},
          },
        },
      ],
    },
  ],
}
