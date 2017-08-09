import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import slugifyWithPrefix from '../src/slugifyWithPrefix'

const pickFirst = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  const found = keys.find(key => (key in obj))
  return obj[found]
}

const LANGUAGE_PRIORITY = ['nb', 'nn', 'en']

export default {
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
      const timeSince = distanceInWordsToNow(value.createdAt, {addSuffix: true})
      return Object.assign({}, value, {
        title: value.title ? pickFirst(value.title, LANGUAGE_PRIORITY) : '',
        subtitle: value.author ? `By ${value.author}, ${timeSince}` : timeSince,
        description: value.lead
      })
    }
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'localeString'
    },
    {
      name: 'readonlyField',
      title: 'A read only string',
      type: 'string',
      readOnly: true
    },
    {
      name: 'lSlug',
      title: 'Localized slug',
      type: 'localeSlug'
    },
    // {
    //   name: 'slug',
    //   title: 'Slug',
    //   description: 'The unique identifier for the blogpost in links and urls',
    //   type: 'slug',
    //   required: true,
    //   options: {
    //     source: document => pickFirst(document.title, LANGUAGE_PRIORITY),
    //     maxLength: 64,
    //     slugifyFn: slugifyWithPrefix('my-prefix')
    //   }
    // },
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
      name: 'video',
      title: 'A video embed',
      type: 'videoEmbed'
    },
    {
      name: 'myCode',
      title: 'Code editor (default)',
      description: 'Choose syntax on input.',
      type: 'code'
    },
    {
      name: 'simpleCode',
      title: 'Code editor simple (markdown)',
      description: 'set syntax in schema',
      type: 'code',
      options: {
        language: 'markdown'
      }
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
          'red',
          'green',
          1, // invalid, not defined in list
          'blue',
          'black',
        ]
      },
      of: [{type: 'string'}]
    },
    {
      name: 'FavoriteColors',
      title: 'Select multiple colors',
      type: 'array',
      options: {
        direction: 'vertical',
        list: [
          {_type: 'color', title: 'Red', name: 'red', _key: 'red'},
          {_type: 'color', title: 'Green', name: 'green', _key: 'green'},
          1, // invalid, not defined in list
          {_type: 'color', title: 'Blue', name: 'blue', _key: 'blue'},
          {_type: 'color', title: 'Black', name: 'black', _key: 'black'},
        ]
      },
      of: [
        {
          type: 'object',
          name: 'color',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            }
          ]
        }
      ]
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
      name: 'arrayOfStringsAndNumbers',
      title: 'Array of strings and numbers (sortable)',
      type: 'array',
      options: {
        sortable: true
      },
      of: [
        {type: 'string'},
        {type: 'number'}
      ]
    },

    {
      name: 'arrayOfStringsNonSortable',
      title: 'Array of strings (not sortable)',
      type: 'array',
      options: {
        sortable: false
      },
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
          title: 'Put a string here',
          description: 'Must be a nice string',
          type: 'string'
        }
      ]
    },
    {
      name: 'arrayOfReadOnly',
      title: 'ReadOnly test',
      description: 'Test readOnly on members of arrays',
      type: 'array',
      // readOnly: true, // toggle comment to test readOnly array values
      of: [
        {
          title: 'Stuff',
          type: 'object',
          name: 'stuff',
          fields: [
            {name: 'something', type: 'string'},
            {name: 'otherThing', type: 'string'}
          ]
        },
        {
          title: 'Read only stuff',
          type: 'object',
          name: 'readOnlyStuff',
          readOnly: true,
          fields: [
            {name: 'something', type: 'string'},
            {name: 'otherThing', type: 'string'}
          ]
        },
        {
          title: 'Semi editable stuff',
          type: 'object',
          name: 'semiEditableStuff',
          fields: [
            {name: 'readOnly', type: 'string', readOnly: true},
            {name: 'canEdit', type: 'string'}
          ]
        },
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
      options: {
        editModal: 'fold'
      },
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
}
