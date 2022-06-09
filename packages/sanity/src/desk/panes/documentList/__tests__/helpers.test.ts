import Schema from '@sanity/schema'
import {ObjectSchemaType} from '@sanity/types'
import {applyOrderingFunctions, fieldExtendsType} from '../helpers'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'category',
      title: 'Category',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
    {
      name: 'span',
      type: 'object',
      fields: [{name: 'text', type: 'string'}],
    },
    {
      name: 'block',
      type: 'object',
      fields: [{name: 'children', type: 'array', of: [{type: 'span'}]}],
    },
    {
      name: 'image',
      type: 'object',
      fields: [{name: 'url', type: 'string'}],
    },
    {
      name: 'aliasedDateTime',
      type: 'datetime',
    },
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [
        {name: 'title', type: 'object', fields: [{name: 'en', type: 'string'}]},
        {name: 'description', type: 'text'},
        {
          name: 'views',
          type: 'number',
        },
        {
          name: 'intro',
          type: 'array',
          of: [{type: 'block'}],
        },
        {
          name: 'body',
          type: 'array',
          of: [{type: 'block'}, {type: 'image'}],
        },
        {
          name: 'publishDate',
          type: 'datetime',
        },
        {
          name: 'relevantUntil',
          type: 'aliasedDateTime',
        },
      ],
    },
  ],
})

describe('applyOrderingFunctions()', () => {
  test('does not apply to orderings with mapper', () => {
    const ordering = {by: [{field: 'title', direction: 'desc' as const, mapWith: 'upper'}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('category'))
    expect(withFn).toStrictEqual(ordering)
  })

  test('does not apply to non-string orderings', () => {
    const ordering = {by: [{field: 'views', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toStrictEqual(ordering)
  })

  test('applies `dateTime()` to shallow datetime field orderings', () => {
    const ordering = {by: [{field: 'publishDate', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toEqual({by: [{...ordering.by[0], mapWith: 'dateTime'}]})
  })

  test('applies `lower()` to shallow string field orderings', () => {
    const ordering = {by: [{field: 'title', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('category'))
    expect(withFn).toEqual({by: [{...ordering.by[0], mapWith: 'lower'}]})
  })

  test('applies `lower()` to deep string field orderings', () => {
    const ordering = {by: [{field: 'title.en', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toEqual({by: [{...ordering.by[0], mapWith: 'lower'}]})
  })

  test('applies `lower()` to deep array-indexed string field orderings within single-type arrays', () => {
    const ordering = {by: [{field: 'intro[0].children[0].text', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toEqual({by: [{...ordering.by[0], mapWith: 'lower'}]})
  })

  test('applies `lower()` to deep key-indexed string field orderings within single-type arrays', () => {
    const ordering = {
      by: [{field: 'intro[_key=="static"].children[0].text', direction: 'desc' as const}],
    }
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toEqual({by: [{...ordering.by[0], mapWith: 'lower'}]})
  })

  test('does not apply to multi-type arrays with array-index accessor', () => {
    const ordering = {by: [{field: 'body[0].children[0].text', direction: 'desc' as const}]}
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toStrictEqual(ordering)
  })

  test('does not apply to multi-type arrays with key accessor', () => {
    const ordering = {
      by: [{field: 'body[_key=="someValue"].children[0].text', direction: 'desc' as const}],
    }
    const withFn = applyOrderingFunctions(ordering, mockSchema.get('article'))
    expect(withFn).toStrictEqual(ordering)
  })
})

describe('fieldExtendsType()', () => {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  test('correctly identifies string fields', () => {
    const field = (mockSchema.get('category') as ObjectSchemaType).fields.find(
      (current) => current.name === 'title'
    )!

    expect(fieldExtendsType(field, 'string')).toBe(true)
  })

  test('correctly identifies text fields as string', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'description'
    )!

    expect(fieldExtendsType(field, 'string')).toBe(true)
  })

  test('correctly identifies datetime fields', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'publishDate'
    )!

    expect(fieldExtendsType(field, 'datetime')).toBe(true)
  })

  test('correctly identifies aliased datetime fields as datetime', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'relevantUntil'
    )!

    expect(fieldExtendsType(field, 'datetime')).toBe(true)
  })

  test('correctly identifies aliased datetime fields as not a number', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'relevantUntil'
    )!

    expect(fieldExtendsType(field, 'number')).toBe(false)
  })
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
})
