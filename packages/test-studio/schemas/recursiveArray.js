export default {
  name: 'recursiveArraysTest',
  type: 'document',
  title: 'Recursive Arrays test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'arrayWithAnonymousObject',
      title: 'Array with anonymous objects',
      description: 'This array contains objects of type as defined inline',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Something',
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
            {
              name: 'imageArrayNotSortable',
              title: 'Image array in grid, *not* sortable',
              description: 'Images here should be append-only',
              type: 'array',
              options: {
                sortable: false,
                layout: 'grid'
              },
              of: [
                {
                  title: 'Image',
                  type: 'image',
                  preview: {
                    select: {
                      imageUrl: 'asset.url',
                      title: 'caption'
                    }
                  },
                  fields: [
                    {
                      name: 'caption',
                      type: 'string',
                      title: 'Caption',
                      options: {
                        isHighlighted: true
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'arrayOfNamedReferences',
              type: 'array',
              title: 'Array of named references',
              description: 'The values here should get _type == authorReference or _type == bookReference',
              options: {
                editModal: 'fold'
              },
              of: [
                {
                  type: 'reference',
                  name: 'authorReference',
                  to: [{type: 'author', title: 'Reference to author'}]
                },
                {
                  type: 'reference',
                  name: 'bookReference',
                  to: [{type: 'book', title: 'Reference to book'}]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
