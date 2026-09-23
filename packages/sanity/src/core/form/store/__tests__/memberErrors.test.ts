import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type Path} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {pathToString} from '../../../field/paths/helpers'
import {MAX_FIELD_DEPTH} from '../constants'
import {createPrepareFormState, type RootFormStateOptions} from '../formState'
import {isObjectFormNode} from '../types/asserters'
import {type FieldError} from '../types/memberErrors'
import {type FieldMember} from '../types/members'
import {type ObjectFormNode} from '../types/nodes'
import {DEFAULT_PROPS} from './shared'

type NestedObjectField = {
  name: string
  type: 'object'
  fields: Array<{name: string; type: 'string'} | NestedObjectField>
}

function getBookType(): ObjectSchemaType {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {
            name: 'quotes',
            type: 'array',
            of: [
              {
                type: 'object',
                fields: [
                  {name: 'quoteText', type: 'string'},
                  {name: 'pageNumber', type: 'number'},
                ],
              },
            ],
          },
          {
            name: 'author',
            type: 'object',
            fields: [
              {name: 'firstName', type: 'string'},
              {name: 'lastName', type: 'string'},
            ],
          },
        ],
      },
    ],
  }).get('book')
}

function nestObjectFields(remaining: number): NestedObjectField {
  if (remaining === 1) {
    return {
      name: 'n1',
      type: 'object',
      fields: [{name: 'label', type: 'string'}],
    }
  }

  return {
    name: `n${remaining}`,
    type: 'object',
    fields: [{name: 'label', type: 'string'}, nestObjectFields(remaining - 1)],
  }
}

function getDeepObjectType(): ObjectSchemaType {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'deepDoc',
        type: 'document',
        fields: [nestObjectFields(MAX_FIELD_DEPTH)],
      },
    ],
  }).get('deepDoc')
}

function prepare(
  documentValue: Record<string, unknown>,
  schemaType: ObjectSchemaType = getBookType(),
): ObjectFormNode {
  const options: RootFormStateOptions = {
    ...DEFAULT_PROPS,
    schemaType,
    documentValue,
    comparisonValue: documentValue,
    baseVariantValue: documentValue,
    perspective: 'drafts',
    hasUpstreamVersion: false,
    hasBaseVariant: false,
    changesOpen: false,
  }

  const state = createPrepareFormState()(options)
  if (state === null) {
    throw new Error('Expected form state')
  }
  return state
}

function fieldMember(node: ObjectFormNode, name: string): FieldMember {
  const member = node.members.find(
    (candidate): candidate is FieldMember => candidate.kind === 'field' && candidate.name === name,
  )
  if (!member) {
    throw new Error(`Expected a field member named "${name}"`)
  }
  return member
}

function errorMember(node: ObjectFormNode, fieldName: string): FieldError {
  const member = node.members.find(
    (candidate): candidate is FieldError =>
      candidate.kind === 'error' && candidate.fieldName === fieldName,
  )
  if (!member) {
    throw new Error(`Expected an error member named "${fieldName}"`)
  }
  return member
}

function getDeepFieldMember(node: ObjectFormNode, path: Path): FieldMember {
  if (path.length === 0) {
    throw new Error('Empty path')
  }
  const [head, ...tail] = path
  const nextField = fieldMember(node, String(head))
  if (tail.length === 0) {
    return nextField
  }
  if (!isObjectFormNode(nextField.field)) {
    throw new Error(`Cannot recurse into non-object node at "${pathToString(node.path)}"`)
  }
  return getDeepFieldMember(nextField.field, tail)
}

describe('array-of-objects member errors', () => {
  test('classifies a non-array value as INCOMPATIBLE_TYPE', () => {
    const state = prepare({_id: 'book-1', _type: 'book', quotes: 'not-an-array'})
    const member = errorMember(state, 'quotes')

    expect(member.path).toEqual(['quotes'])
    expect(member.error).toEqual(
      expect.objectContaining({
        type: 'INCOMPATIBLE_TYPE',
        resolvedValueType: 'string',
        value: 'not-an-array',
      }),
    )
    expect(fieldMember(state, 'title').kind).toBe('field')
  })

  test('classifies an object stored on an array field as INCOMPATIBLE_TYPE', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: {_key: 'q1', quoteText: 'hello'},
    })
    const member = errorMember(state, 'quotes')

    expect(member.error.type).toBe('INCOMPATIBLE_TYPE')
    expect(member.error).toEqual(
      expect.objectContaining({
        type: 'INCOMPATIBLE_TYPE',
        resolvedValueType: 'object',
      }),
    )
  })

  test('classifies a primitive among objects as MIXED_ARRAY', () => {
    const quotes = [{_key: 'q1', quoteText: 'ok'}, 'bare string']
    const state = prepare({_id: 'book-1', _type: 'book', quotes})
    const member = errorMember(state, 'quotes')

    expect(member.error).toEqual({
      type: 'MIXED_ARRAY',
      schemaType: expect.objectContaining({jsonType: 'array'}),
      value: quotes,
    })
  })

  test('classifies a null array item as MIXED_ARRAY', () => {
    const quotes = [{_key: 'q1', quoteText: 'ok'}, null]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})

    expect(errorMember(state, 'quotes').error.type).toBe('MIXED_ARRAY')
  })

  test('classifies objects missing _key as MISSING_KEYS', () => {
    const quotes = [{_key: 'q1', quoteText: 'has a key'}, {quoteText: 'missing a key'}]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})
    const member = errorMember(state, 'quotes')

    expect(member.error).toEqual({
      type: 'MISSING_KEYS',
      schemaType: expect.objectContaining({jsonType: 'array'}),
      value: quotes,
    })
  })

  test('classifies duplicate _key values as DUPLICATE_KEYS and reports later indexes', () => {
    const quotes = [
      {_key: 'shared', quoteText: 'first'},
      {_key: 'shared', quoteText: 'second'},
      {_key: 'unique', quoteText: 'third'},
      {_key: 'shared', quoteText: 'fourth'},
    ]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})
    const member = errorMember(state, 'quotes')

    expect(member.error).toEqual({
      type: 'DUPLICATE_KEYS',
      schemaType: expect.objectContaining({jsonType: 'array'}),
      duplicates: [
        [1, 'shared'],
        [3, 'shared'],
      ],
    })
  })

  test('prefers MIXED_ARRAY when items are both non-objects and missing keys', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: [{quoteText: 'no key'}, 'primitive'],
    })

    expect(errorMember(state, 'quotes').error.type).toBe('MIXED_ARRAY')
  })

  test('prefers MISSING_KEYS when some items lack _key even if others collide', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: [
        {_key: 'shared', quoteText: 'first'},
        {_key: 'shared', quoteText: 'second'},
        {quoteText: 'no key'},
      ],
    })

    expect(errorMember(state, 'quotes').error.type).toBe('MISSING_KEYS')
  })

  test('treats an empty array as a normal field, not an error', () => {
    const state = prepare({_id: 'book-1', _type: 'book', quotes: []})

    expect(state.members.some((member) => member.kind === 'error')).toBe(false)
    expect(fieldMember(state, 'quotes').kind).toBe('field')
  })

  test('treats an absent array as a normal field, not an error', () => {
    const state = prepare({_id: 'book-1', _type: 'book'})

    expect(state.members.some((member) => member.kind === 'error')).toBe(false)
    expect(fieldMember(state, 'quotes').kind).toBe('field')
  })

  test('keeps a well-keyed object array as a normal field', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: [{_key: 'q1', quoteText: 'ok'}],
    })

    expect(fieldMember(state, 'quotes').kind).toBe('field')
  })

  test('classifies colliding empty-string keys as DUPLICATE_KEYS', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: [
        {_key: '', quoteText: 'first'},
        {_key: '', quoteText: 'second'},
      ],
    })

    expect(errorMember(state, 'quotes').error).toEqual(
      expect.objectContaining({
        type: 'DUPLICATE_KEYS',
        duplicates: [[1, '']],
      }),
    )
  })

  test.fails('classifies an undefined _key as MISSING_KEYS', () => {
    const quotes = [{_key: undefined, quoteText: 'undefined key'}]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})

    expect(errorMember(state, 'quotes').error.type).toBe('MISSING_KEYS')
  })
})

describe('object member errors', () => {
  test('classifies a non-object value on an object field as INCOMPATIBLE_TYPE', () => {
    const state = prepare({_id: 'book-1', _type: 'book', author: 'Ada'})
    const member = errorMember(state, 'author')

    expect(member.path).toEqual(['author'])
    expect(member.error).toEqual(
      expect.objectContaining({
        type: 'INCOMPATIBLE_TYPE',
        resolvedValueType: 'string',
        value: 'Ada',
      }),
    )
  })
})

describe('MAX_FIELD_DEPTH', () => {
  test('omits the object field once the prepared level reaches MAX_FIELD_DEPTH', () => {
    const schemaType = getDeepObjectType()
    const state = prepare({_id: 'deep-1', _type: 'deepDoc'}, schemaType)
    const pathToLastVisible = Array.from({length: MAX_FIELD_DEPTH - 1}, (_, index) => {
      return `n${MAX_FIELD_DEPTH - index}`
    })
    const lastVisible = getDeepFieldMember(state, pathToLastVisible)

    expect(isObjectFormNode(lastVisible.field)).toBe(true)
    if (!isObjectFormNode(lastVisible.field)) {
      throw new Error('Expected the last visible node to be an object')
    }

    expect(
      lastVisible.field.members.map((member) => member.kind === 'field' && member.name),
    ).toEqual(['label'])
    expect(() => getDeepFieldMember(state, [...pathToLastVisible, 'n1'])).toThrow(
      'Expected a field member named "n1"',
    )
  })
})
