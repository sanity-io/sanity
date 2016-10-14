export default {
  name: 'blocks',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'priority',
          title: 'Priority',
          type: 'number'
        },
        {
          name: 'checked',
          title: 'Published',
          type: 'boolean'
        },
        {
          name: 'content',
          type: 'array',
          title: 'Blocks',
          editor: 'slate',
          of: [
            {
              title: 'Paragraph',
              type: 'paragraph',
              marks: [
                'bold',
                'italic',
                'underline',
                'overline',
                'line-through',
                'code'
              ]
            },
            {
              title: 'String',
              type: 'string'
            },
            {
              title: 'Image',
              type: 'simpleImage'
            },
            {
              title: 'Author',
              type: 'author'
            },
            {
              title: 'Location',
              type: 'geopoint'
            }
          ]
        }
      ]
    },
    {
      name: 'simpleImage',
      type: 'object',
      fields: [
        {
          title: 'Image address (url)',
          name: 'url',
          type: 'url'
        },
        {
          title: 'Caption',
          name: 'caption',
          type: 'string'
        }
      ]
    },
    {
      name: 'geopoint',
      type: 'object',
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number',
          required: true
        },
        {
          name: 'lon',
          title: 'Longitude',
          type: 'number',
          required: true
        }
      ]
    },
    {
      name: 'author',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Title',
          type: 'string'
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
          name: 'homestead',
          title: 'Homestead',
          type: 'object',
          fields: [
            {
              name: 'lat',
              title: 'Latitude',
              type: 'number',
              required: true
            },
            {
              name: 'lon',
              title: 'Longitude',
              type: 'number',
              required: true
            }
          ]
        }
      ]
    },
    {
      name: 'paragraph',
      title: 'Paragraph object',
      type: 'object',
      fields: [
        {
          name: 'content',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'type',
                  type: 'string'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
