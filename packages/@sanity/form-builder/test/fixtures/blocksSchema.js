import Schema from '@sanity/schema'

export default Schema.compile({
  name: 'myBlog',
  types: [
    {
      name: 'test',
      title: 'Test',
      type: 'object',
      fields: [
        {
          type: 'string',
          name: 'title'
        }
      ]
    },
    {
      type: 'object',
      name: 'blogPost',
      fields: [
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [{type: 'block'}, {type: 'image'}, {type: 'test'}]
        }
      ]
    }
  ]
})
