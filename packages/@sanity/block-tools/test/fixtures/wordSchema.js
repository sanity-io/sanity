import Schema from '@sanity/schema'

export default Schema.compile({
  name: 'myBlog',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [
        {
          title: 'Title',
          type: 'string',
          name: 'title'
        },
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [
            {
              type: 'block',
              marks: {
                annotations: [
                  {
                    type: 'object',
                    name: 'link',
                    title: 'Link',
                    fields: [
                      {
                        name: 'href',
                        type: 'string',
                        title: 'Url'
                      }
                    ]
                  },
                  {
                    type: 'object',
                    name: 'note',
                    title: 'Note',
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
                        of: {
                          type: 'block'
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
})
