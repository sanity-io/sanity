export default {
  name: 'fieldsets',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      displayField: 'author',
      fieldsets: [
        {
          name: 'headings',
          title: 'Headings',
          description: 'FIELDSET HEADINGS DESCRIPTION',
          options: {
            columns: 2
          }
        },
        {
          name: 'author',
          title: 'Author details (collapsible)',
          description: 'Author details with 2 column grid',
          options: {
            columns: 2,
            collapsable: true
          }
        },
        {
          name: 'checkboxes',
          title: 'Checkbox (collapsible)',
          description: 'Lets put 3 checkboxes in an a 3 column',
          options: {
            columns: 3,
            collapsable: true
          }
        }
      ],
      fields: [
        {
          name: 'foo',
          title: 'Foo',
          description: 'Foo foo foo fooooooooooo',
          type: 'string',
          fieldset: 'headings'
        },
        {
          name: 'title',
          title: 'Title',
          description: 'Title title title…',
          type: 'string',
          fieldset: 'headings'
        },
        {
          name: 'author',
          title: 'Author',
          description: 'Author author author…',
          type: 'person',
          fieldset: 'author'
        },
        {
          name: 'test',
          title: 'Author details extra string',
          description: 'Details extra string',
          type: 'string',
          fieldset: 'author'
        },
        {
          name: 'murgh',
          type: 'string',
          title: 'Murgh',
          description: 'Murgh is nice, and this is a description of it.'
        },
        {
          name: 'lead',
          title: 'Lead',
          description: 'Lead is a metal and a chemical element',
          type: 'text',
          format: 'html'
        },
        {
          name: 'check-one',
          title: 'Check one?',
          type: 'boolean',
          fieldset: 'checkboxes'
        },
        {
          name: 'check-two',
          title:
            'Check two?, But this one we but a long label on. Very very very long. Like REALLY long.',
          description: 'Description',
          type: 'boolean',
          fieldset: 'checkboxes'
        },
        {
          name: 'check-three',
          title: 'Check three?',
          description: 'Description',
          type: 'boolean',
          fieldset: 'checkboxes'
        },
        {
          name: 'content',
          title: 'Content',
          description: 'Description',
          type: 'array',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        {
          name: 'standalone-check',
          title: 'Standalone checkbox',
          description: 'Description',
          type: 'boolean'
        },
        {
          name: 'gnargh',
          title: 'Inline/anonymous object',
          description: 'Description',
          type: 'object',
          fields: [
            {
              name: 'petpeeve',
              type: 'string',
              title: 'Pet peeve',
              description: 'Description'
            },
            {
              name: 'color',
              type: 'string',
              title: 'Color',
              description: 'Description'
            }
          ]
        }
      ]
    },
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fieldsets: [
        {
          name: 'basics',
          title: 'Basics',
          description: 'This is a fieldset'
        },
        {
          name: 'street',
          title: 'Street',
          description: 'This is a fieldset'
        }
      ],
      fields: [
        {
          name: 'street',
          type: 'string',
          title: 'Street',
          description: 'Description',
          fieldset: 'street'
        },
        {
          name: 'zip',
          type: 'string',
          title: 'Zip',
          description: 'Description',
          fieldset: 'basics'
        },
        {
          name: 'place',
          type: 'string',
          title: 'Place',
          description: 'Description',
          fieldset: 'basics'
        }
      ]
    },
    {
      name: 'person',
      type: 'object',
      title: 'Object with plain fields',
      description: 'Description',
      fields: [
        {name: 'firstname', type: 'string', title: 'First name', description: 'Description'},
        {name: 'lastname', type: 'string', title: 'Last name', description: 'Description'},
        {name: 'address', type: 'address', title: 'Address', description: 'Description'}
      ]
    }
  ]
}
