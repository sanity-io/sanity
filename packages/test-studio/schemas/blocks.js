import icon from 'react-icons/lib/md/rate-review'

export default {
  name: 'blocksTest',
  title: 'Blocks test',
  type: 'document',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'defaults',
      title: 'Content',
      description: 'Profound description of what belongs here',
      type: 'array',
      of: [
        {type: 'image', title: 'Image'},
        {
          type: 'reference', name: 'authorReference',
          to: {type: 'author'},
          title: 'Reference to author'
        },
        {
          type: 'reference',
          name: 'bookReference',
          to: {type: 'book'},
          title: 'Reference to book'
        },
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
        {
          type: 'color',
          title: 'Color',
          options: {
            inline: true
          }
        },
        {
          type: 'color',
          name: 'colorBlock',
          title: 'Color (block)'
        },
        {
          type: 'object', title: 'Test object', name: 'testObject',
          fields: [{name: 'field1', type: 'string'}]
        },
        {
          type: 'object', title: 'Other test object', name: 'otherTestObject',
          fields: [
            {name: 'field1', type: 'string'},
            {
              name: 'field3',
              type: 'array',
              of: [
                {type: 'object', fields: [
                  {name: 'aString', type: 'string'},
                  {name: 'aNumber', type: 'number'},
                ]}
              ]
            }
          ]
        },
        {type: 'block'},
      ]
    },
    {
      name: 'readOnlyWithDefaults',
      title: 'Read only with defaults',
      description: 'This is read only',
      type: 'array',
      readOnly: true,
      of: [
        {type: 'image', title: 'Image'},
        {
          type: 'reference', name: 'authorReference',
          to: {type: 'author'},
          title: 'Reference to author'
        },
        {
          type: 'reference',
          name: 'bookReference',
          to: {type: 'book'},
          title: 'Reference to book'
        },
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
        {
          type: 'color',
          title: 'Color',
          options: {
            inline: true
          }
        },
        {
          type: 'color',
          name: 'colorBlock',
          title: 'Color (block)'
        },
        {
          type: 'object', title: 'Test object', name: 'testObject',
          fields: [{name: 'field1', type: 'string'}]
        },
        {
          type: 'object', title: 'Other test object', name: 'otherTestObject',
          fields: [
            {name: 'field1', type: 'string'},
            {
              name: 'field3',
              type: 'array',
              of: [
                {type: 'object', fields: [
                    {name: 'aString', type: 'string'},
                    {name: 'aNumber', type: 'number'},
                  ]}
              ]
            }
          ]
        },
        {type: 'block'},
      ]
    },
    {
      name: 'minimal',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: []
          }
        }
      ]
    },
    {
      name: 'customized',
      title: 'Customized with block types',
      type: 'array',
      of: [
        {type: 'image', title: 'Image', options: {inline: true}},
        {type: 'author', title: 'Author'},
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ],
            annotations: [{name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}}]
          }
        }
      ]
    },
    {
      name: 'deep',
      title: 'Blocks deep down',
      type: 'object',
      fields: [
        {name: 'something', title: 'Something', type: 'string'},
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
            {type: 'image', title: 'Image'},
            {type: 'author', title: 'Author'},
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H1', value: 'h1'},
                {title: 'H2', value: 'h2'},
                {title: 'Quote', value: 'blockquote'}
              ],
              lists: [
                {title: 'Bullet', value: 'bullet'},
                {title: 'Numbered', value: 'number'}
              ],
              marks: {
                decorators: [
                  {title: 'Strong', value: 'strong'},
                  {title: 'Emphasis', value: 'em'}
                ],
                annotations: [{name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}}]
              }
            }
          ]
        }
      ]
    },
    {
      name: 'recursive',
      type: 'object',
      fields: [
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
            {
              type: 'block',
              styles: [],
              lists: [],
              marks: {
                decorators: [],
                annotations: []
              }
            },
            {
              type: 'blocksTest',
              title: 'Blocks test!'
            }
          ]
        }
      ]
    }
  ]
}
