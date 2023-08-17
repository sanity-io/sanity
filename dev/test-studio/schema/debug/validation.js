// import sanityClient from 'part:@sanity/base/client'
import {points, featureCollection} from '@turf/helpers'
import pointsWithinPolygon from '@turf/points-within-polygon'
import norway from './data/norway'
import {CustomObjectSelectInput} from './components/CustomObjectSelectInput'

export const validationArraySuperType = {
  name: 'imageArray',
  title: 'Array supertype',
  description:
    'This field uses a supertype of an image array without validation. This tests that when used as a field type it can add its own validation rules',
  type: 'array',
  of: [
    {
      type: 'image',
    },
  ],
}

export default {
  name: 'validationTest',
  type: 'document',
  title: 'Validation test',
  validation: (Rule) =>
    Rule.custom((doc) => {
      if (!doc || !doc.title) {
        return true
      }

      const needsUrl = (doc.title[0] || '').toUpperCase() === doc.title[0]
      return needsUrl && !doc.myUrlField
        ? 'When the first character of the title is uppercase, you will need to fill out the "Plain url"-field'
        : true
    }),
  fields: [
    {
      name: 'checkbox',
      type: 'boolean',
      title: 'Checked?',
      // readOnly: true,
      description: 'Must be false, should be displayed as a checkbox',
      validation: (Rule) => [Rule.valid(false).warning('hello world')],
      options: {
        layout: 'checkbox',
      },
    },
    {
      name: 'switch',
      type: 'boolean',
      title: 'Check me?',
      validation: (Rule) => Rule.required().valid(true),
      description: 'Must be true',
    },
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'Required field with minimum/maximum length validation',
      validation: (Rule) => Rule.required().min(5).max(100),
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Field of slug type',
      description: 'Required, updates from title',
      validation: (Rule) => Rule.required(),
      options: {
        source: (document) => document.title,
      },
    },
    {
      type: 'string',
      name: 'infoValidation',
      title: 'Info validation',
      validation: (rule) => rule.min(8).info('This is an information validation message'),
    },
    {
      name: 'myUrlField',
      type: 'url',
      title: 'Plain url',
      description: 'URL validation (inferred)',
    },
    {
      name: 'myFancyUrlField',
      type: 'url',
      title: 'Fancy URL',
      description: 'URL that only allows mailto: and tel: schemes',
      validation: (Rule) => Rule.uri({scheme: ['mailto', 'tel']}),
    },
    {
      name: 'relativeUrl',
      type: 'url',
      title: 'Relative URL',
      description: 'URL that allows relative URLs',
      validation: (Rule) => Rule.uri({allowRelative: true}),
    },
    {
      name: 'date',
      type: 'datetime',
      title: 'Some date',
      description: 'ISO-formatted date, inferred, must be in 2017',
      validation: (Rule) => Rule.min('2017-01-01 00:00:00').max('2017-12-31 00:00:00'),
    },
    {
      name: 'email',
      type: 'email',
      title: 'Recipient email',
      description: 'Email, inferred',
    },
    {
      name: 'intro',
      type: 'text',
      title: 'Introduction',
      description: 'Required, and warn if less than 50 characters',
      validation: (Rule) => [
        Rule.required(),
        Rule.min(50).warning('Should probably be at least 50 characters'),
      ],
    },
    {
      name: 'lowestTemperature',
      type: 'number',
      title: 'Lowest temperature recorded',
      description: 'Only negative numbers',
      validation: (Rule) => Rule.negative(),
    },
    {
      name: 'highestTemperature',
      type: 'number',
      title: 'Highest temperature recorded',
      description: 'Only positive numbers larger than lowest temperature',
      validation: (Rule) => Rule.positive().min(Rule.valueOfField('lowestTemperature')),
    },
    {
      name: 'onlyPositive',
      type: 'number',
      title: 'Only positive',
      validation: (Rule) => Rule.positive(),
    },
    {
      name: 'someInteger',
      type: 'number',
      title: 'Some integer',
      description: 'Only integers',
      validation: (Rule) => Rule.integer(),
    },
    {
      name: 'precision',
      type: 'number',
      title: 'Precision',
      description: 'Max precision of 2',
      validation: (Rule) => Rule.precision(2),
    },
    {
      name: 'zeroPrecision',
      type: 'number',
      title: 'Zero precision',
      description: 'Max precision of 0',
      validation: (Rule) => Rule.precision(0),
    },
    {
      name: 'quotes',
      title: 'Quotes',
      description: 'Unique quotes - minimum of one',
      validation: (Rule) => Rule.required().min(2),
      type: 'array',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.min(2).max(100),
        },
      ],
    },
    {
      name: 'imageArray',
      title: 'Images',
      type: 'imageArray',
      validation: (Rule) => [Rule.min(1), Rule.required()],
    },
    {
      name: 'authors',
      title: 'Authors',
      description: 'Unique inline authors',
      validation: (Rule) => Rule.unique(),
      type: 'array',
      of: [
        {
          type: 'author',
        },
      ],
    },
    {
      name: 'books',
      title: 'Books',
      description: 'Unique book references, minimum 1, max 5',
      validation: (Rule) => Rule.unique().min(1).max(5),
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'book'}],
        },
      ],
    },
    {
      name: 'bookWithCover',
      title: 'Book that has a cover photo',
      description: 'Reference to a book with custom rule that ensures referenced book has a cover',
      type: 'reference',
      to: [{type: 'book'}],
      validation: (Rule) =>
        Rule.custom(
          (value) =>
            new Promise((resolve) => {
              if (!value || !value._ref) {
                return resolve(true)
              }

              return Promise.resolve(true)

              // return client.fetch('*[_id == $id][0].coverImage', {id: value._ref}).then((cover) => {
              //   resolve(cover ? true : 'Referenced book must have a cover image')
              // })
            }),
        ),
    },
    {
      name: 'titleCase',
      title: 'Title Case',
      description: 'Regex-based title case, custom error message',
      type: 'string',
      validation: (Rule) =>
        Rule.min(1)
          .regex(/^(?:[A-Z][^\s]*\s?)+$/)
          .error('Must be in Title Case'),
    },
    {
      name: 'translations',
      title: 'Translations',
      description: 'All fields required.',
      type: 'object',
      fields: [
        {
          name: 'no',
          type: 'string',
          title: 'Norwegian (Bokmål)',
          validation: (Rule) => Rule.required().error('All fields are required'),
        },
        {
          name: 'nn',
          type: 'string',
          title: 'Norwegian (Nynorsk)',
          validation: (Rule) => Rule.required().error('All fields are required'),
        },
        {
          name: 'se',
          type: 'string',
          title: 'Swedish',
          validation: (Rule) => Rule.required().error('All fields are required'),
        },
      ],
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'dropdown',
      title: 'Dropdown thing',
      description: 'Inferred to have one of the defined values, and explicitly set as required',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: ['one', 'two', 'three'],
      },
    },
    {
      name: 'radio',
      title: 'Radio thing',
      type: 'string',
      description: 'Same as above, but as radio',
      options: {
        layout: 'radio',
        list: ['one', 'two', 'three'],
      },
    },
    {
      name: 'readonlyField',
      type: 'string',
      title: 'A read only string',
      description: 'It may have a value, but it cannot be edited',
      validation: (Rule) => Rule.required().min(5),
      readOnly: true,
    },

    {
      name: 'person',
      type: 'object',
      fieldsets: [{name: 'social', title: 'Social media handles'}],
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'string',
          description: 'Required within a fieldset',
          validation: (Rule) => Rule.required(),
          fieldset: 'social',
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'string',
          fieldset: 'social',
        },
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'string',
          fieldset: 'social',
        },
      ],
    },

    {
      name: 'arrayOfPredefined',
      title: 'Array of predefined options',
      description: 'We required at least one of these to be checked',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
      options: {
        direction: 'vertical',
        list: [
          {_type: 'reference', _key: 'grrm', _ref: 'grrm'},
          {_type: 'reference', _key: 'jrr-tolkien', _ref: 'jrr-tolkien'},
        ],
      },
    },
    {
      name: 'inheritedArray',
      title: 'Inherited array type with custom validation',
      type: 'gallery',
      validation: (Rule) => [Rule.min(2), Rule.max(6).warning('too many images')],
    },
    {
      name: 'location',
      type: 'geopoint',
      title: 'A geopoint',
      description: 'Required, must be in Norway somewhere',
      validation: (Rule) =>
        Rule.required().custom((geoPoint) => {
          if (!geoPoint) {
            return true
          }

          const location = points([[geoPoint.lng, geoPoint.lat]])
          const norwayFeature = featureCollection(norway)
          const ptsWithin = pointsWithinPolygon(location, norwayFeature)
          return ptsWithin.features.length > 0 ? true : 'Location must be in Norway'
        }),
    },

    {
      name: 'body',
      title: 'Block content',
      type: 'array',
      of: [
        {type: 'author', title: 'Author'},
        {
          type: 'block',
          of: [{type: 'image', title: 'Image', options: {inline: true}}],
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}},
            ],
          },
        },
      ],
    },
    {
      name: 'bymonth',
      title: 'By Month',
      description:
        'Set the months to apply the recurrence to. Example: By Month of Jan and Aug = This event occurs weekly in the month of January and August.',
      type: 'array',
      of: [{type: 'number'}],
      validation: (Rule) => Rule.min(2),
      options: {
        list: [
          {title: 'Jan', value: 0},
          {title: 'Feb', value: 1},
          {title: 'March', value: 2},
          {title: 'April', value: 3},
          {title: 'May', value: 4},
          {title: 'June', value: 5},
          {title: 'July', value: 6},
          {title: 'Aug', value: 7},
          {title: 'Sept', value: 8},
          {title: 'Oct', value: 9},
          {title: 'Nov', value: 10},
          {title: 'Dec', value: 11},
        ],
      },
    },
    {
      name: 'arrayOfSlugs',
      title: 'Array of slugs',
      type: 'array',
      validation: (Rule) => Rule.unique(),
      of: [
        {
          type: 'object',
          name: 'slugEmbed',
          fields: [
            {
              type: 'slug',
              name: 'sku',
              title: 'SKU',
              validation: (Rule) => Rule.required(),
            },
            {
              type: 'string',
              name: 'title',
              title: 'title',
              validation: (Rule) => Rule.required().min(3),
            },
          ],
        },
      ],
    },

    {
      name: 'deepInline',
      type: 'object',
      title: 'Deep inline object',
      description: 'Because why not, right?',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'deeper',
          title: 'Child',
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => [
                Rule.required().uppercase(),
                Rule.max(3).warning('Min 3 characters'),
              ],
            },
            {
              name: 'deeper',
              title: 'Child',
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                },
                {
                  name: 'deeper',
                  title: 'Child',
                  type: 'object',
                  fields: [
                    {
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                      validation: (Rule) => [
                        Rule.required().uppercase(),
                        Rule.max(3).warning('Min 3 characters'),
                      ],
                    },
                    {
                      name: 'deeper',
                      title: 'Child',
                      type: 'object',
                      fields: [
                        {
                          name: 'title',
                          title: 'Title',
                          type: 'string',
                          description: 'Required, uppercase',
                          validation: (Rule) => [
                            Rule.required().uppercase(),
                            Rule.max(3).warning('Min 3 characters'),
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'objectList',
      title: 'Object field with custom input supporting `list` option',
      type: 'object',
      validation: (Rule) => Rule.required(),
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'value',
          type: 'string',
        },
      ],
      options: {
        list: [
          {title: 'Red', value: '#f00'},
          {title: 'Green', value: '#0f0'},
          {title: 'Blue', value: '#00f'},
        ],
      },
      components: {input: CustomObjectSelectInput},
    },
    {
      name: 'requiredObjectWithFields',
      description:
        'Because this object is required, the sub-field validation will run even if the object is undefined.',
      type: 'object',
      validation: (Rule) => Rule.required().error('Please fill out this object'),
      fields: [
        {
          name: 'title',
          type: 'string',
          validation: (Rule) => Rule.required().error('Title is required'),
        },
      ],
    },
    {
      name: 'optionalObjectWithFields',
      description:
        'Because this object is not required, the sub-field validation will NOT run if the object is undefined. You must touch it first.',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          validation: (Rule) => Rule.required().error('Title is required.'),
        },
      ],
    },
  ],
}
