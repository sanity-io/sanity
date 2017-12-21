export default {
  name: 'richText',
  type: 'document',
  title: 'Rich text',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'body',
      type: 'array',
      title: 'Content',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                type: 'object',
                name: 'blockNote',
                title: 'Block note',
                annotationMarker: '*',
                fields: [
                  {
                    type: 'string',
                    name: 'style',
                    options: {
                      list: [
                        {title: 'Footnote', value: 'footnote'},
                        {title: 'Endnote', value: 'endnote'}
                      ]
                    }
                  },
                  {
                    name: 'content',
                    title: 'Content',
                    type: 'array',
                    of: [{type: 'block'}]
                  }
                ]
              }
            ]
          }
        },
        {
          title: 'Image',
          type: 'image',
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        }
      ]
    }
  ]
}
