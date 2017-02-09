const BLOGPOST = {
  type: 'object',
  name: 'blogpost',
  fields: [
    {
      name: 'array',
      of: [
        {
          type: 'block',
          lists: true,
          styles: [
            {name: 'h1'},
            {name: 'h2'},
            {name: 'h3'},
            {name: 'h4'},
          ],
          spans: {
            marks: ['strong', 'em', 'underline'],
            links: [
              {
                type: 'anchor'
              },
              {
                type: 'reference',
                to: []
              }
            ]
          }
        },
        {
          type: 'author',
          name: 'Author'
        },
        {
          type: 'image',
          name: 'Image'
        }
      ]
    }
  ]
}
