import {Schema} from '@sanity/schema'
import {defineType, type ObjectSchemaType} from '@sanity/types'
import {expect, it} from 'vitest'

import {introspectSchema} from './introspectSchema'

const bookSchemaType = Schema.compile({
  types: [
    defineType({
      name: 'store',
      type: 'object',
      fields: [
        {
          name: 'address',
          title: 'Address',
          type: 'string',
        },
      ],
    }),
    defineType({
      name: 'book',
      type: 'document',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'translations',
          title: 'Translations',
          type: 'object',
          fields: [
            {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
            {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
            {name: 'se', type: 'string', title: 'Swedish'},
          ],
        },
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: {type: 'author', title: 'Author'},
        },
        {
          name: 'favoriteColors',
          title: 'Favourite Colours',
          type: 'array',
          of: [{type: 'string'}],
        },
        {
          name: 'luckyNumbers',
          title: 'Lucky Numbers',
          type: 'array',
          of: [{type: 'string'}, {type: 'number'}],
        },
        {
          name: 'retailers',
          title: 'Retailers',
          type: 'array',
          of: [
            {
              name: 'website',
              type: 'object',
              fields: [
                {
                  name: 'websiteName',
                  title: 'Website Name',
                  type: 'string',
                },
              ],
            },
            {
              type: 'store',
            },
          ],
        },
        {
          name: 'coverImage',
          title: 'Cover Image',
          type: 'image',
          options: {hotspot: true},
        },
        {
          name: 'publicationYear',
          title: 'Year of publication',
          type: 'number',
        },
        {
          name: 'isbn',
          title: 'ISBN number',
          description: 'ISBN-number of the book. Not shown in studio.',
          type: 'number',
          hidden: true,
        },
        {
          name: 'reviewsInline',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'review',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                },
              ],
            },
          ],
        },
        {
          name: 'genre',
          title: 'Genre',
          type: 'string',
          options: {
            list: [
              {title: 'Fiction', value: 'fiction'},
              {title: 'Non Fiction', value: 'nonfiction'},
              {title: 'Poetry', value: 'poetry'},
            ],
          },
        },
      ],
    }),
  ],
}).get('book') as ObjectSchemaType

it('can introspect root fields', () => {
  const path = ['title']
  const segments = [...introspectSchema(bookSchemaType, path)]

  expect(segments.length).toBe(1)
  expect(segments[0].title).toBe('Title')
})

it('can introspect object fields', () => {
  const path = ['translations', 'nn']
  const segments = [...introspectSchema(bookSchemaType, path)]

  expect(segments.length).toBe(2)
  expect(segments[0].title).toBe('Translations')
  expect(segments[1].title).toBe('Norwegian (Nynorsk)')
})

it('can introspect monomorphic primitive arrays without type hint', () => {
  const segments = [...introspectSchema(bookSchemaType, ['favoriteColors', 0])]

  expect(segments.length).toBe(2)
  expect(segments[0].title).toBe('Favourite Colours')
  expect(segments[1].title).toBe('String')
})

it('can introspect monomorphic object arrays without type hint', () => {
  const segments = [...introspectSchema(bookSchemaType, ['reviewsInline', {_key: 'x'}])]

  expect(segments.length).toBe(2)
  expect(segments[0].title).toBe('Reviews Inline')
  expect(segments[1].title).toBe('Review')
})

it('can introspect polymorphic primitive arrays with type hint', () => {
  const segmentsString = [
    ...introspectSchema(bookSchemaType, [
      'luckyNumbers',
      {
        segment: 0,
        type: 'string',
      },
    ]),
  ]

  const segmentsNumber = [
    ...introspectSchema(bookSchemaType, [
      'luckyNumbers',
      {
        segment: 0,
        type: 'number',
      },
    ]),
  ]

  expect(segmentsString.length).toBe(2)
  expect(segmentsString[0].title).toBe('Lucky Numbers')
  expect(segmentsString[1].title).toBe('String')

  expect(segmentsNumber.length).toBe(2)
  expect(segmentsNumber[0].title).toBe('Lucky Numbers')
  expect(segmentsNumber[1].title).toBe('Number')
})

it('can introspect polymorphic object arrays with type hint', () => {
  const segmentsWebsite = [
    ...introspectSchema(bookSchemaType, [
      'retailers',
      {
        segment: {_key: 'x'},
        type: 'website',
      },
    ]),
  ]

  const segmentsStore = [
    ...introspectSchema(bookSchemaType, [
      'retailers',
      {
        segment: {_key: 'x'},
        type: 'store',
      },
    ]),
  ]

  expect(segmentsWebsite.length).toBe(2)
  expect(segmentsWebsite[0].title).toBe('Retailers')
  expect(segmentsWebsite[1].title).toBe('Website')

  expect(segmentsStore.length).toBe(2)
  expect(segmentsStore[0].title).toBe('Retailers')
  expect(segmentsStore[1].title).toBe('Store')
})
