import createSchema from 'part:@sanity/base/schema-creator'

export default createSchema({
  name: 'example-blog',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'priority',
          title: 'Priority',
          type: 'number'
        },
        {
          name: 'checked',
          title: 'Checked',
          type: 'boolean'
        },
        {
          name: 'select',
          title: 'Select',
          type: 'string',
          options: {
            list: [
              {
                title: 'One (1)',
                value: 'one'
              },
              {
                title: 'Two (2)',
                value: 'two'
              },
              {
                title: 'Three (3)',
                value: 'three'
              }
            ]
          }
        },
        {
          name: 'radioSelect',
          title: 'Select (layout: radio)',
          type: 'string',
          options: {
            layout: 'radio',
            list: [
              {
                title: 'One (1)',
                value: 'one'
              },
              {
                title: 'Two (2)',
                value: 'two'
              },
              {
                title: 'Three (3)',
                value: 'three'
              }
            ]
          }
        },
        {
          name: 'lead',
          title: 'Lead',
          type: 'text',
          format: 'html',
          required: true
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email'
        },
        {
          name: 'location',
          title: 'Location',
          type: 'geopoint'
        },
        {
          name: 'content',
          type: 'array',
          title: 'Content tags',
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        {
          name: 'authors',
          title: 'Authors',
          type: 'array',
          of: [
            {
              type: 'author'
            }
          ],
          required: true
        }
      ]
    },
    {
      name: 'author',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Title',
          type: 'string'
        },
        {
          name: 'awards',
          title: 'Awards',
          type: 'array',
          of: [
            {
              type: 'string'
            }
          ]
        }
      ]
    }
  ]
})
