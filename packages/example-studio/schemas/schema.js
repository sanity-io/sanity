import createSchema from 'part:@sanity/base/schema-creator'
import blockArray from './block-array'
import moment from 'moment'

// Example of a custom slugify function that
// makes a slug-string and prefixes it with something from the
// schema and then calls the default slugify function.
function slugifyWithPrefix(prefix) {
  return function (type, slug, slugify) {
    let newSlug = slug
    if (slug.substring(0, prefix.length) === `${prefix}`) {
      newSlug = slug.substring(prefix.length, slug.length)
    }
    return slugify(type, `${prefix}-${newSlug}`)
      .substring(0, type.options.maxLength)
  }
}

export default createSchema({
  name: 'example-blog',
  types: [
    ...blockArray,
    {
      name: 'blogpost',
      type: 'object',
      title: 'Blogpost',
      preview: {
        select: {
          title: 'title',
          createdAt: '_createdAt',
          lead: 'lead',
          imageUrl: 'mainImage.asset.url',
          author: 'authorRef.name'
        },
        prepare(value) {
          const timeSince = moment(value.createdAt).fromNow()
          return Object.assign({}, value, {
            subtitle: value.author ? `By ${value.author}, ${timeSince}` : timeSince,
            description: value.lead
          })
        }
      },
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'publishAt',
          title: 'Publish at',
          type: 'date',
          description: 'Blogpost goes live at this date/time',
          options: {
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm',
            timeStep: 60,
            calendarTodayLabel: 'Today',
            inputUtc: false,
            inputDate: true,
            inputTime: true
          }
        },
        {
          name: 'file',
          title: 'Plain file upload',
          type: 'file'
        },
        {
          name: 'mainImage',
          title: 'Main image',
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        },
        {
          name: 'rating',
          title: 'Rating',
          type: 'number',
          options: {
            range: {min: 0, max: 10, step: 0.2}
          },
          required: true
        },
        {
          name: 'selectMultipleStrings',
          title: 'Select multiple strings',
          type: 'array',
          options: {
            direction: 'vertical',
            list: [
              {title: 'Red', value: 'red'},
              {title: 'Green', value: 'green'},
              {title: 'Blue', value: 'blue'},
              {title: 'Black', value: 'black'},
            ]
          },
          of: [{
            type: 'string'
          }]
        },
        {
          name: 'pngImage',
          title: 'PNG image',
          type: 'image',
          options: {
            hotspot: true,
            accept: 'image/png'
          }
        },
        {
          name: 'slug',
          title: 'Slug',
          description: 'The unique identifier for the blogpost in links and urls',
          type: 'slug',
          required: true,
          options: {
            source: 'title',
            maxLength: 64,
            slugifyFn: slugifyWithPrefix('creepy')
          }
        },
        {
          name: 'tags',
          title: 'tags',
          type: 'array',
          options: {
            layout: 'tags'
          },
          of: [
            {type: 'string'}
          ]
        },
        {
          name: 'arrayOfStrings',
          title: 'Array of strings',
          type: 'array',
          of: [
            {type: 'string'}
          ]
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
          name: 'someObject',
          title: 'An object',
          type: 'object',
          fields: [
            {
              name: 'first',
              type: 'string',
              title: 'First field'
            },
            {
              name: 'second',
              type: 'string',
              title: 'Second field'
            }
          ]
        },
        {
          name: 'body',
          type: 'array',
          title: 'Blocks',
          of: [
            {
              title: 'Block',
              type: 'block'
            }
          ]
        },
        {
          name: 'imageGallery',
          title: 'Image gallery',
          type: 'array',
          options: {
            layout: 'grid',
            sortable: true
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
          name: 'select',
          title: 'Select string',
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
          name: 'selectObjectOfString',
          title: 'Select string in object',
          description: '',
          type: 'string',
          options: {
            list: ['one', 'two', 'three']
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
          of: [
            {
              title: 'String',
              type: 'string'
            }
          ]
        },
        {
          name: 'firstAuthor',
          title: 'Author',
          type: 'reference',
          to: {type: 'author'},
          required: true
        },
        {
          name: 'coauthors',
          title: 'Co authors',
          type: 'array',
          of: [{
            type: 'reference',
            title: 'Reference to co-author',
            to: {
              type: 'author'
            }
          }],
          required: true
        },
        {
          name: 'extraAuthors',
          title: 'Additional authors',
          description: 'Note: This is an inline array of authors',
          type: 'array',
          options: {
            editModal: 'fold'
          },
          of: [
            {
              title: 'Additional author reference',
              type: 'author'
            }
          ],
          required: true
        },
        {
          name: 'extraSuperAuthors',
          title: 'Additional super authors',
          description: 'Note: This is an inline array of authors',
          type: 'array',
          options: {
            editModal: 'fullscreen'
          },
          of: [
            {
              title: 'Additional super author reference',
              type: 'author'
            }
          ],
          required: true
        },
        {
          name: 'superAuthors',
          title: 'Super authors',
          type: 'array',
          options: {
            editModal: 'fullscreen'
          },
          of: [{
            title: 'Reference to super author',
            type: 'reference',
            to: {
              type: 'author'
            }
          }],
          required: true
        },
      ]
    },
    {
      name: 'author',
      type: 'object',
      title: 'Author',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string'
        },
        {
          name: 'image',
          title: 'Image',
          type: 'image'
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
        },
        {
          name: 'relatedAuthors',
          title: 'Related authors',
          type: 'array',
          of: [
            {
              type: 'reference',
              to: {type: 'author'}
            }
          ]
        }
      ]
    }
  ]
})
