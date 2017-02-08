export default {
  name: 'slate',
  types: [
    {
      name: 'document',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'paragraph',
              title: 'Paragraph'
            },
            {
              type: 'address',
              title: 'Address'
            }
          ],
        }
      ]
    },
    {
      name: 'paragraph',
      type: 'object',
      fields: [
        {
          name: 'spans',
          type: 'array',
          of: [
            {
              type: 'span',
              title: 'Text'
            },
            {
              type: 'link',
              title: 'Link'
            }
          ]
        }
      ]
    },
    {
      name: 'span',
      type: 'object',
      fields: [
        {
          name: 'text',
          type: 'text'
        },
        {
          name: 'marks',
          type: 'array',
          title: 'Marks',
          of: [
            {
              type: 'mark',
              title: 'Marks'
            }
          ]
        }
      ]
    },
    {
      name: 'link',
      type: 'object',
      fields: [
        {
          type: 'url',
          name: 'href',
          title: 'Url'
        },
        {
          name: 'nodes',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'span',
              name: 'title',
              title: 'Content'
            }
          ]
        }
      ]
    },
    {
      name: 'mark',
      type: 'object',
      title: 'Mark',
      fields: [
        {
          name: 'type',
          title: 'Type',
          type: 'string'
        }
      ]
    },
    {
      name: 'address',
      type: 'object',
      fields: [
        {
          name: 'street',
          type: 'string',
          title: 'Street'
        },
        {
          name: 'zip',
          type: 'string',
          title: 'Zip'
        }
      ]
    }

  ]
}
0
