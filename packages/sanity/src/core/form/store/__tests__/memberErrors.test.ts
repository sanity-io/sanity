import {Schema} from '@sanity/schema'
import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createPrepareFormState, type RootFormStateOptions} from '../formState'
import {type FieldError} from '../types/memberErrors'
import {type FieldMember} from '../types/members'
import {type ObjectFormNode} from '../types/nodes'
import {DEFAULT_PROPS} from './shared'

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
        ],
      },
    ],
  }).get('book')
}

function prepare(documentValue: Record<string, unknown>): ObjectFormNode {
  const options: RootFormStateOptions = {
    ...DEFAULT_PROPS,
    schemaType: getBookType(),
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

describe('array-of-objects member errors', () => {
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

  test('classifies an undefined _key as MISSING_KEYS', () => {
    const quotes = [{_key: undefined, quoteText: 'undefined key'}]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})

    expect(errorMember(state, 'quotes').error.type).toBe('MISSING_KEYS')
  })

  test('classifies an empty-string _key as MISSING_KEYS', () => {
    const quotes = [{_key: '', quoteText: 'empty key'}]
    const state = prepare({_id: 'book-1', _type: 'book', quotes})

    expect(errorMember(state, 'quotes').error.type).toBe('MISSING_KEYS')
  })

  test('keeps a well-keyed object array as a normal field', () => {
    const state = prepare({
      _id: 'book-1',
      _type: 'book',
      quotes: [{_key: 'q1', quoteText: 'ok'}],
    })

    expect(fieldMember(state, 'quotes').kind).toBe('field')
  })
})
