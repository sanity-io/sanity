export default {
  name: 'assets',
  types: [
    {
      name: 'user',
      type: 'object',
      fields: [
        {name: 'name', type: 'string', title: 'Name'},
        {name: 'photo', type: 'image', title: 'Portrait'}
      ]
    },
    {
      name: 'archive',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'singleFile',
          title: 'Single file',
          type: 'file'
        },
        {
          name: 'singleImageNoFields',
          title: 'Single image without fields',
          type: 'image'
        },
        {
          name: 'imageList',
          title: 'List of images',
          type: 'array',
          of: [{type: 'user'}]
        },
        {
          name: 'singleImage',
          title: 'Single image with fields',
          type: 'image',
          fields: [
            {
              /* todo make implicit maybe? */
              name: 'asset',
              type: 'reference',
              to: [{type: 'imageAsset'}]
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              options: {isHighlighted: true}
            },
            {
              name: 'altText',
              title: 'Alternative text',
              type: 'string',
              options: {isHighlighted: true}
            },
            {
              name: 'someThingNotThatImportant',
              title: 'Something not so important',
              type: 'string'
            },
            {
              name: 'hotspot',
              type: 'object',
              fields: [
                {
                  name: 'x',
                  type: 'number'
                },
                {
                  name: 'y',
                  type: 'number'
                },
                {
                  name: 'height',
                  type: 'number'
                },
                {
                  name: 'width',
                  type: 'number'
                }
              ]
            },
            {
              name: 'crop',
              type: 'object',
              fields: [
                {
                  name: 'top',
                  type: 'number'
                },
                {
                  name: 'left',
                  type: 'number'
                },
                {
                  name: 'right',
                  type: 'number'
                },
                {
                  name: 'bottom',
                  type: 'number'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
