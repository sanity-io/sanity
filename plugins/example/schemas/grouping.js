export default {
  name: 'grouping',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      displayField: 'author',
      groups: [
        {
          name: 'headings',
          title: 'Headings',
          collapsed: true
        }
      ],
      fields: [
        {
          name: 'foo',
          title: 'Foo',
          type: 'string',
          group: 'headings'
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          group: 'headings'
        },
        {
          name: 'murgh',
          type: 'string',
          title: 'Murgh'
        },
        {
          name: 'lead',
          title: 'Lead',
          type: 'text'
        },
        {
          name: 'content',
          type: 'array',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        }
      ]
    }
  ]
}
