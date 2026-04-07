import {Schema} from '@sanity/schema'
import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {
  applyOrderingFunctions,
  fieldExtendsType,
  findStaticTypesInFilter,
  validateSortOrder,
} from '../helpers'

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
  test('correctly identifies string fields', () => {
    const field = (mockSchema.get('category') as ObjectSchemaType).fields.find(
      (current) => current.name === 'title',
    )!

    expect(fieldExtendsType(field, 'string')).toBe(true)
  })

  test('correctly identifies text fields as string', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'description',
    )!

    expect(fieldExtendsType(field, 'string')).toBe(true)
  })

  test('correctly identifies datetime fields', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'publishDate',
    )!

    expect(fieldExtendsType(field, 'datetime')).toBe(true)
  })

  test('correctly identifies aliased datetime fields as datetime', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'relevantUntil',
    )!

    expect(fieldExtendsType(field, 'datetime')).toBe(true)
  })

  test('correctly identifies aliased datetime fields as not a number', () => {
    const field = (mockSchema.get('article') as ObjectSchemaType).fields.find(
      (current) => current.name === 'relevantUntil',
    )!

    expect(fieldExtendsType(field, 'number')).toBe(false)
  })
})

describe('validateSortOrder()', () => {
  const fallback = {by: [{field: '_updatedAt', direction: 'desc' as const}]}

  test('returns sort order unchanged when all fields are built-in', () => {
    const sortOrder = {by: [{field: '_updatedAt', direction: 'desc' as const}]}
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(sortOrder)
  })

  test('returns sort order unchanged when custom field exists in schema', () => {
    const sortOrder = {by: [{field: 'title', direction: 'asc' as const}]}
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(sortOrder)
  })

  test('returns fallback when custom field does not exist in schema', () => {
    const sortOrder = {by: [{field: 'displayTitle', direction: 'asc' as const}]}
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(fallback)
  })

  test('returns fallback when any field in a multi-field sort is invalid', () => {
    const sortOrder = {
      by: [
        {field: '_updatedAt', direction: 'desc' as const},
        {field: 'nonExistentField', direction: 'asc' as const},
      ],
    }
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(fallback)
  })

  test('returns sort order as-is when schemaType is undefined', () => {
    const sortOrder = {by: [{field: 'anyField', direction: 'asc' as const}]}
    const result = validateSortOrder(sortOrder, undefined, fallback)
    expect(result).toBe(sortOrder)
  })

  test.each(['_id', '_type', '_rev', '_createdAt', '_updatedAt'])(
    'accepts built-in field %s',
    (field) => {
      const sortOrder = {by: [{field, direction: 'asc' as const}]}
      const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
      expect(result).toBe(sortOrder)
    },
  )

  test('validates nested field paths correctly', () => {
    const validNested = {by: [{field: 'title.en', direction: 'asc' as const}]}
    expect(validateSortOrder(validNested, mockSchema.get('article'), fallback)).toBe(validNested)

    const invalidNested = {by: [{field: 'title.fr', direction: 'asc' as const}]}
    expect(validateSortOrder(invalidNested, mockSchema.get('article'), fallback)).toBe(fallback)
  })

  test('cross-workspace scenario: sort order valid in one schema but not another', () => {
    const workspaceBSchema = Schema.compile({
      name: 'workspaceB',
      types: [
        {
          name: 'page',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
      ],
    })

    const sortByDisplayTitle = {
      by: [{field: 'displayTitle', direction: 'asc' as const}],
      extendedProjection: 'displayTitle',
    }

    const result = validateSortOrder(sortByDisplayTitle, workspaceBSchema.get('page'), fallback)
    expect(result).toBe(fallback)
  })

  test('passes through sort order with empty by array', () => {
    const sortOrder = {by: []}
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(sortOrder)
  })

  test('preserves extendedProjection on valid sort order', () => {
    const sortOrder = {
      by: [{field: 'title', direction: 'asc' as const}],
      extendedProjection: 'title',
    }
    const result = validateSortOrder(sortOrder, mockSchema.get('category'), fallback)
    expect(result).toBe(sortOrder)
  })
})

describe('findStaticTypesInFilter()', () => {
  test('returns the types from a simple filter clause', () => {
    expect(findStaticTypesInFilter('_type == "a"')).toEqual(['a'])
  })

  test('returns multiple types from a simple filter clause', () => {
    expect(findStaticTypesInFilter('_type == "a" || "b" == _type')).toEqual(['a', 'b'])
  })

  test('returns multiple types from `in` expressions', () => {
    expect(findStaticTypesInFilter('_type in ["a", "b"]')).toEqual(['a', 'b'])
  })

  test('returns the types in `&&` expressions', () => {
    expect(findStaticTypesInFilter('_type in ["a", "b"] && isActive')).toEqual(['a', 'b'])
  })

  test('returns null if the types cannot be statically determined', () => {
    expect(findStaticTypesInFilter('_type == "a" || isActive')).toEqual(null)
  })

  test('works with parameters', () => {
    expect(findStaticTypesInFilter('_type in ["a", $b]', {b: 'b'})).toEqual(['a', 'b'])
  })
})
