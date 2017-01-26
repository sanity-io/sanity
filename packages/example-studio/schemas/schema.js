import createSchema from 'part:@sanity/base/schema-creator'


// Example of a custom slugify function that
// makes a slug-string and prefixes it with something in the
// schema definition for that slug field
function slugifyWithPrefix(prefix) {
  return function(type, slug) {
    return slug ? `${prefix}-` + slug.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .substring(0, type.options.maxLength) : ''
  }
}

export default createSchema({
  name: 'example-blog',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      title: 'Blogpost',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'slug',
          title: 'Slug',
          type: 'slug',
          required: true,
          options: {
            source: 'title',
            maxLength: 64,
            slugifyFn: slugifyWithPrefix('blogpost')
          }
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
          title: 'Content tags',
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
        },
        {
          name: 'authorRef',
          title: 'Author reference',
          type: 'reference',
          to: {
            type: 'author'
          },
          required: true
        }
      ]
    },
    {
      name: 'author',
      type: 'object',
      title: 'Author',
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
