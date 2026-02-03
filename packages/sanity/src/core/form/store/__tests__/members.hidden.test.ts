import {Schema} from '@sanity/schema'
import {type ConditionalProperty, type ObjectSchemaType} from '@sanity/types'
import {beforeEach, expect, test} from 'vitest'

import {
  createCallbackResolver,
  type RootCallbackResolver,
} from '../conditional-property/createCallbackResolver'
import {createPrepareFormState, type PrepareFormState} from '../formState'
import {DEFAULT_PROPS, MOCK_USER} from './shared'

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

let prepareFormState!: PrepareFormState
let prepareHiddenState!: RootCallbackResolver<'hidden'>

beforeEach(() => {
  prepareFormState = createPrepareFormState()
  prepareHiddenState = createCallbackResolver({property: 'hidden'})
})

test('it omits the hidden member field from the members array', () => {
  const schemaType: ObjectSchemaType = getBookType({
    subtitle: {hidden: () => true},
  })

  const documentValue = {_id: 'foo', _type: 'book'}
  const result = prepareFormState({
    ...DEFAULT_PROPS,
    hidden: prepareHiddenState({currentUser: MOCK_USER, documentValue, schemaType}),
    schemaType,
    documentValue,
    comparisonValue: documentValue,
  })

  expect(result).not.toBe(null)
  if (result === null) {
    throw new Error('should not be hidden')
  }
  const fieldNames = result.members.map((member) => member.kind === 'field' && member.name)
  expect(fieldNames).not.toContain('subtitle')
})

test('it omits nested hidden members from the members array', () => {
  const schemaType = getBookType({
    author: {hidden: () => true},
  })
  const documentValue = {_id: 'foo', _type: 'book'}
  const result = prepareFormState({
    ...DEFAULT_PROPS,
    schemaType: schemaType,
    hidden: prepareHiddenState({currentUser: MOCK_USER, documentValue: documentValue, schemaType}),
    documentValue,
  })

  expect(result).not.toBe(null)
  if (result === null) {
    throw new Error('should not be hidden')
  }
  const fieldNames = result.members.map((member) => member.kind === 'field' && member.name)
  expect(fieldNames).not.toContain('author')
})

test('it "upward propagates" hidden fields', () => {
  // If the hidden callback for every field of an object type returns true, the whole object should be hidden
  const schemaType = getBookType({
    authorFirstName: {hidden: () => true},
    authorLastName: {hidden: () => true},
  })
  const document = {_id: 'foo', _type: 'book'}
  const result = prepareFormState({
    ...DEFAULT_PROPS,
    schemaType,
    value: document,
    hidden: prepareHiddenState({currentUser: MOCK_USER, documentValue: document, schemaType}),
  })
  expect(result).not.toBe(null)
  if (result === null) {
    throw new Error('should not be hidden')
  }
  const fieldNames = result.members.map((member) => member.kind === 'field' && member.name)
  expect(fieldNames).not.toContain('author')
})
