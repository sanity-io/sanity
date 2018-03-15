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
          name: 'slug',
          title: 'Slug',
          type: 'slug',
          options: {
            source: 'title',
            maxLength: 96
          }
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
              marks: ['bold', 'italic', 'underline', 'overline', 'line-through', 'code']
            },
            {
              title: 'Header 1',
              type: 'header',
              marks: ['bold', 'italic', 'underline', 'line-through'],
              level: 1
            },
            {
              title: 'Header 2',
              type: 'header',
              marks: ['bold', 'italic', 'underline', 'line-through'],
              level: 2
            },
            {
              title: 'Header 3',
              type: 'header',
              marks: ['bold', 'italic', 'underline', 'line-through'],
              level: 3
            },
            {
              title: 'Header 4',
              type: 'header',
              marks: ['bold', 'italic', 'underline', 'line-through'],
              level: 4
            },
            {
              title: 'Numbered list',
              type: 'list',
              listStyle: 'number'
            },
            {
              title: 'Bullet list',
              type: 'list',
              listStyle: 'bullet'
            },
            {
              title: 'Roman list',
              type: 'list',
              listStyle: 'roman'
            },
            {
              title: 'List item',
              type: 'listItem',
              marks: ['bold', 'italic', 'underline', 'line-through']
            },
            {
              title: 'Link',
              type: 'link',
              marks: ['bold', 'italic', 'underline', 'line-through']
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
        },
        {
          name: 'minimal',
          type: 'array',
          title: 'Blocks',
          editor: 'slate',
          of: [
            {
              title: 'Paragraph',
              type: 'paragraph'
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
      ],

      options: {
        preview: value => {
          return {
            title: value ? value.caption : ''
          }
        }
      }
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
    }
  ]
}
