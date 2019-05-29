import Schema from '@sanity/schema'

export default Schema.compile({
  name: 'withCustomBlockType',
  types: [
    {type: 'document', name: 'author', fields: [{type: 'string', name: 'name', title: 'Name'}]},
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
              // Only allow these styles
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H1', value: 'h1'},
                {title: 'H2', value: 'h2'}
              ],
              // Only allow numbered lists
              lists: [{title: 'Numbered', value: 'number'}],
              marks: {
                // Only allow these decorators
                decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}],
                // Support annotating text with a reference to an author
                annotations: [
                  {name: 'author', title: 'Author', type: 'reference', to: {type: 'author'}}
                ]
              }
            }
          ]
        }
      ]
    }
  ]
})
