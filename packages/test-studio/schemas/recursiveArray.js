import icon from 'react-icons/lib/ti/infinity'

export default {
  name: 'recursiveArraysTest',
  type: 'document',
  title: 'Recursive Arrays test',
  icon,
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
        {type: 'recursiveArraysTest'},
        {
          type: 'object',
          title: 'Something',
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
            {name: 'image', type: 'image', title: 'An image', options: {hotspot: true}},
            {
              name: 'gallery',
              title: 'Image array',
              type: 'array',
              options: {
                layout: 'grid'
              },
              of: [
                {
                  title: 'Book',
                  type: 'book'
                },
                {
                  title: 'Image',
                  type: 'image',
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
              description:
                'The values here should get _type == authorReference or _type == bookReference',
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
            },
            {
              name: 'aReferenceAtTheEnd',
              type: 'reference',
              to: [{type: 'book', title: 'Reference to book'}]
            },
            {
              name: 'aDateTimeAtTheEnd',
              type: 'datetime'
            }
          ]
        }
      ]
    },
    {name: 'end', type: 'string', title: 'A field at the end'},
    {name: 'anotherEnd', type: 'string', title: 'Another field at the end'}
  ]
}
