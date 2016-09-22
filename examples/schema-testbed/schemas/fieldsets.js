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
          title: 'Author details',
          description: 'Author details with 2 column grid',
          options: {
            columns: 2
          }
        },
        {
          name: 'checkboxes',
          title: 'Checkbox Mc. Checkboxface',
          description: 'Lets put 3 checkboxes in an a 3 column',
          options: {
            columns: 3
          }
        }
      ],
      fields: [
        {
          name: 'foo',
          title: 'Foo',
          type: 'string',
          fieldset: 'headings'
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          fieldset: 'headings'
        },
        {
          name: 'author',
          title: 'Author',
          type: 'person',
          fieldset: 'author'
        },
        {
          name: 'test',
          title: 'Author details extra string',
          type: 'string',
          fieldset: 'author'
        },
        {
          name: 'murgh',
          type: 'string',
          title: 'Murgh'
        },
        {
          name: 'lead',
          title: 'Lead',
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
          title: 'Check two?, But this one we but a long label on. Very very very long. Like REALLY long.',
          type: 'boolean',
          fieldset: 'checkboxes'
        },
        {
          name: 'check-three',
          title: 'Check three?',
          type: 'boolean',
          fieldset: 'checkboxes'
        },
        {
          name: 'content',
          title: 'Content',
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
          type: 'boolean'
        },
        {
          name: 'gnargh',
          title: 'Inline/anonymous object',
          type: 'object',
          fields: [
            {
              name: 'petpeeve',
              type: 'string',
              title: 'Pet peeve'
            },
            {
              name: 'color',
              type: 'string',
              title: 'Color'
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
          fieldset: 'street'
        },
        {
          name: 'zip',
          type: 'string',
          title: 'Zip',
          fieldset: 'basics'
        },
        {
          name: 'place',
          type: 'string',
          title: 'Place',
          fieldset: 'basics'
        }
      ]
    },
    {
      name: 'person',
      type: 'object',
      title: 'Object with plain fields',
      fields: [
        {name: 'firstname', type: 'string', title: 'First name'},
        {name: 'lastname', type: 'string', title: 'Last name'},
        {name: 'address', type: 'address', title: 'Address'}
      ]
    },
  ]
}
