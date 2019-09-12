import Schema from '@sanity/schema'

export default Schema.compile({
  name: 'withDefaultBlockType',
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
            {type: 'block'},
            {
              name: 'code',
              type: 'object',
              title: 'Code',
              fields: [
                {
                  title: 'Code',
                  name: 'code',
                  type: 'text'
                },
                {
                  name: 'language',
                  title: 'Language',
                  type: 'string'
                },
                {
                  title: 'Highlighted lines',
                  name: 'highlightedLines',
                  type: 'array',
                  of: [
                    {
                      type: 'number',
                      title: 'Highlighted line'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
})
