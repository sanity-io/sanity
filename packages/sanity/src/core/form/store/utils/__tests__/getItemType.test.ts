import {
  type ArraySchemaType,
  defineField,
  defineType,
  isArraySchemaType,
  type ObjectSchemaType,
} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSchema} from '../../../../schema/createSchema'
import {getItemType, getPrimitiveItemType} from '../getItemType'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'author',
      type: 'object',
      fields: [defineField({name: 'name', type: 'string'})],
    }),
    defineType({
      name: 'editor',
      type: 'object',
      fields: [defineField({name: 'name', type: 'string'})],
    }),
    defineType({
      name: 'catalogCode',
      type: 'string',
    }),
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({
          name: 'authors',
          type: 'array',
          of: [{type: 'author'}],
        }),
        defineField({
          name: 'contributors',
          type: 'array',
          of: [{type: 'author'}, {type: 'editor'}],
        }),
        defineField({
          name: 'quotes',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [defineField({name: 'text', type: 'string'})],
            },
          ],
        }),
        defineField({
          name: 'namedQuotes',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'quote',
              fields: [defineField({name: 'text', type: 'string'})],
            },
          ],
        }),
        defineField({
          name: 'tags',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'mixedPrimitives',
          type: 'array',
          of: [{type: 'string'}, {type: 'number'}, {type: 'boolean'}],
        }),
        defineField({
          name: 'codes',
          type: 'array',
          of: [{type: 'catalogCode'}],
        }),
      ],
    }),
  ],
})

const compiledArticle = schema.get('article')
if (!compiledArticle || compiledArticle.jsonType !== 'object') {
  throw new Error('Expected the compiled article document type')
}

function getArrayField(fieldName: string): ArraySchemaType {
  const field = (compiledArticle as ObjectSchemaType).fields.find(
    (member) => member.name === fieldName,
  )
  if (!field || !isArraySchemaType(field.type)) {
    throw new Error(`Expected array field ${fieldName}`)
  }
  return field.type
}

const authors = getArrayField('authors')
const contributors = getArrayField('contributors')
const quotes = getArrayField('quotes')
const namedQuotes = getArrayField('namedQuotes')
const tags = getArrayField('tags')
const mixedPrimitives = getArrayField('mixedPrimitives')
const codes = getArrayField('codes')

describe('getItemType', () => {
  test('treats an untyped object as the only member of a single-type array', () => {
    expect(getItemType(authors, {})?.name).toBe('author')
    expect(getItemType(authors, {name: 'Ada'})?.name).toBe('author')
  })

  test('resolves a typed object by its _type name', () => {
    expect(getItemType(authors, {_type: 'author', name: 'Ada'})?.name).toBe('author')
    expect(getItemType(contributors, {_type: 'editor', name: 'Bea'})?.name).toBe('editor')
  })

  test('does not guess a member when a polymorphic array item has no _type', () => {
    expect(getItemType(contributors, {})).toBeUndefined()
    expect(getItemType(contributors, {name: 'Ada'})).toBeUndefined()
  })

  test('returns undefined when _type is not in the array of-types', () => {
    expect(getItemType(authors, {_type: 'editor'})).toBeUndefined()
    expect(getItemType(contributors, {_type: 'reviewer'})).toBeUndefined()
  })

  test('returns undefined for primitives, null and missing items', () => {
    expect(getItemType(authors, 'Ada')).toBeUndefined()
    expect(getItemType(authors, 3)).toBeUndefined()
    expect(getItemType(authors, null)).toBeUndefined()
    expect(getItemType(authors, undefined)).toBeUndefined()
  })

  test('resolves an anonymous object member from an untyped or typed item', () => {
    expect(getItemType(quotes, {})?.jsonType).toBe('object')
    expect(getItemType(quotes, {_type: 'object', text: 'Hello'})?.jsonType).toBe('object')
  })

  test('resolves a named inline object member and still accepts an untyped item when it is the only of-type', () => {
    expect(getItemType(namedQuotes, {_type: 'quote', text: 'Hello'})?.name).toBe('quote')
    expect(getItemType(namedQuotes, {})?.name).toBe('quote')
  })
})

describe('getPrimitiveItemType', () => {
  test('resolves a primitive by its json type name', () => {
    expect(getPrimitiveItemType(tags, 'news')?.name).toBe('string')
    expect(getPrimitiveItemType(mixedPrimitives, 'news')?.name).toBe('string')
    expect(getPrimitiveItemType(mixedPrimitives, 3)?.name).toBe('number')
    expect(getPrimitiveItemType(mixedPrimitives, true)?.name).toBe('boolean')
  })

  test('matches a custom string type by jsonType when the item is a string', () => {
    expect(getPrimitiveItemType(codes, 'SKU-1')?.name).toBe('catalogCode')
  })

  test('returns undefined when the item is not a primitive the array accepts', () => {
    expect(getPrimitiveItemType(tags, 3)).toBeUndefined()
    expect(getPrimitiveItemType(tags, {})).toBeUndefined()
    expect(getPrimitiveItemType(tags, null)).toBeUndefined()
    expect(getPrimitiveItemType(tags, undefined)).toBeUndefined()
  })
})
