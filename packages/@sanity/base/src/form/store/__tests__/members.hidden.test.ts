import Schema from '@sanity/schema'
import {ConditionalProperty} from '@sanity/types'
import {deriveFormState} from '../formState'

// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = () => {}

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

const MOCK_USER = {id: 'bjoerge', email: 'bjoerge@gmail.com', name: 'Bjørge', roles: []}

test('it omits the hidden member field from the members array', () => {
  const bookType = getBookType({
    subtitle: {hidden: () => true},
  })
  const result = deriveFormState(bookType, {
    document: {_id: 'foo', _type: 'book'},
    onSetFieldGroupState: noop,
    level: 0,
    currentUser: MOCK_USER,
    onChange: noop,
  })

  const fieldNames = result.members.map((member) => member.type === 'field' && member.field.name)
  expect(fieldNames).not.toContain('subtitle')
})

test('it omits nested hidden members from the members array', () => {
  const bookType = getBookType({
    author: {hidden: () => true},
  })
  const result = deriveFormState(bookType, {
    document: {_id: 'foo', _type: 'book'},
    onSetFieldGroupState: noop,
    level: 0,
    currentUser: MOCK_USER,
    onChange: noop,
  })

  const fieldNames = result.members.map((member) => member.type === 'field' && member.field.name)
  expect(fieldNames).not.toContain('author')
})

test('it "upward propagates" hidden fields', () => {
  // If the hidden callback for every field of an object type returns true, the whole object should be hidden
  const bookType = getBookType({
    authorFirstName: {hidden: () => true},
    authorLastName: {hidden: () => true},
  })
  const result = deriveFormState(bookType, {
    document: {_id: 'foo', _type: 'book'},
    onSetFieldGroupState: noop,
    level: 0,
    currentUser: MOCK_USER,
    onChange: noop,
  })

  const fieldNames = result.members.map((member) => member.type === 'field' && member.field.name)
  expect(fieldNames).not.toContain('author')
})
