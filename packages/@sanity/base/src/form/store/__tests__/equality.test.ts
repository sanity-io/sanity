import {ConditionalProperty} from '@sanity/types'
import Schema from '@sanity/schema'
import {prepareFormProps} from '../formState'
import {DEFAULT_PROPS} from './shared'

function getBookType(properties: {
  root?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  title?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  subtitle?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  author?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  quotes?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  quoteText?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  quotePageNumber?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  authorFirstName?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
  authorLastName?: {hidden?: ConditionalProperty; readOnly?: ConditionalProperty}
}) {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        ...properties.root,
        fields: [
          {name: 'title', type: 'string', ...properties.title},
          {name: 'subtitle', type: 'string', ...properties.subtitle},
          {
            name: 'quotes',
            type: 'array',
            ...properties.quotes,
            of: [
              {
                type: 'object',
                fields: [
                  {
                    name: 'quoteText',
                    type: 'string',
                    ...properties.quoteText,
                  },
                  {
                    name: 'pageNumber',
                    type: 'number',
                    ...properties.quotePageNumber,
                  },
                ],
              },
            ],
          },
          {
            name: 'author',
            type: 'object',
            fields: [
              {
                name: 'firstName',
                title: 'First name',
                type: 'string',
                ...properties.authorFirstName,
              },
              {
                name: 'lastName',
                title: 'Last name',
                type: 'string',
                ...properties.authorLastName,
              },
            ],
            ...properties.author,
          },
        ],
      },
    ],
  }).get('book')
}

test('it doesnt return new object equalities given the same input', () => {
  const document = {_id: 'test', _type: 'foo'}
  const bookType = getBookType({})

  const state1 = prepareFormProps({
    ...DEFAULT_PROPS,
    type: bookType,
    document,
  } as any)

  const state2 = prepareFormProps({
    ...DEFAULT_PROPS,
    type: bookType,
    document,
  } as any)
  expect(state1.hidden).toBe(false)
  expect(state2.hidden).toBe(false)
  if (state1.hidden || state2.hidden) {
    throw new Error('should not be hidden')
  }

  expect(state1.value).toBe(state2.value)
  // expect(state1.members[0]).toBe(state2.members[0])
})
