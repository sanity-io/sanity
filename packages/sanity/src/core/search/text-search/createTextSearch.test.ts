import {describe, expect, it} from '@jest/globals'
import {Schema} from '@sanity/schema'
import {defineField, defineType} from '@sanity/types'

import {
  getDocumentTypeConfiguration,
  getOrder,
  getQueryString,
  isNegationToken,
  isPrefixToken,
  prefixLast,
} from './createTextSearch'

const testType = Schema.compile({
  types: [
    defineType({
      name: 'basic-schema-test',
      type: 'document',
      preview: {
        select: {
          title: 'title',
          subtitle: 'subtitle',
          description: 'description',
        },
      },
      fields: [
        defineField({
          name: 'title',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          type: 'string',
        }),
        defineField({
          name: 'description',
          type: 'string',
        }),
      ],
    }),
    defineType({
      name: 'basic-schema-test-preview-override',
      type: 'document',
      preview: {
        select: {
          title: 'title',
          subtitle: 'subtitle',
          description: 'description',
        },
      },
      fields: [
        defineField({
          name: 'title',
          type: 'string',
          options: {
            search: {
              weight: 2,
            },
          },
        }),
        defineField({
          name: 'subtitle',
          type: 'string',
          options: {
            search: {
              weight: 3,
            },
          },
        }),
        defineField({
          name: 'description',
          type: 'string',
          options: {
            search: {
              weight: 4,
            },
          },
        }),
      ],
    }),
    defineType({
      name: 'basic-schema-test-non-preview-fields',
      type: 'document',
      preview: {
        select: {
          title: 'title',
        },
      },
      fields: [
        defineField({
          name: 'title',
          type: 'string',
        }),
        defineField({
          name: 'variety',
          type: 'string',
          options: {
            search: {
              weight: 2,
            },
          },
        }),
      ],
    }),
    defineType({
      name: 'basic-schema-test-hidden-fields',
      type: 'document',
      preview: {
        select: {
          title: 'title',
        },
      },
      fields: [
        defineField({
          name: 'title',
          type: 'string',
        }),
        defineField({
          name: 'variety',
          type: 'string',
          hidden: true,
        }),
      ],
    }),
  ],
})

describe('getDocumentTypeConfiguration', () => {
  it('includes default weights for the preview selection', () => {
    expect(
      getDocumentTypeConfiguration(
        {},
        {
          types: [testType.get('basic-schema-test')],
          query: 'test',
        },
      ),
    ).toEqual({
      'basic-schema-test': {
        weights: {
          title: 10,
          subtitle: 5,
          description: 1.5,
        },
      },
    })
  })

  it('includes custom search weight configuration for the preview selection', () => {
    expect(
      getDocumentTypeConfiguration(
        {},
        {
          types: [testType.get('basic-schema-test-preview-override')],
          query: 'test',
        },
      ),
    ).toEqual({
      'basic-schema-test-preview-override': {
        weights: {
          title: 2,
          subtitle: 3,
          description: 4,
        },
      },
    })
  })

  it('includes custom search weight configuration for non-preview fields', () => {
    expect(
      getDocumentTypeConfiguration(
        {},
        {
          types: [testType.get('basic-schema-test-non-preview-fields')],
          query: 'test',
        },
      ),
    ).toEqual({
      'basic-schema-test-non-preview-fields': {
        weights: {
          title: 10,
          variety: 2,
        },
      },
    })
  })

  it('gives a zero weighting to hidden fields', () => {
    expect(
      getDocumentTypeConfiguration(
        {},
        {
          types: [testType.get('basic-schema-test-hidden-fields')],
          query: 'test',
        },
      ),
    ).toEqual({
      'basic-schema-test-hidden-fields': {
        weights: {
          title: 10,
          variety: 0,
        },
      },
    })
  })
})

describe('getSort', () => {
  it('transforms Studio sort options to valid Text Search sort options', () => {
    expect(
      getOrder([
        {
          field: 'title',
          direction: 'desc',
        },
        {
          field: '_createdAt',
          direction: 'asc',
        },
      ]),
    ).toEqual([
      {
        attribute: 'title',
        direction: 'desc',
      },
      {
        attribute: '_createdAt',
        direction: 'asc',
      },
    ])
  })
})

describe('getQueryString', () => {
  it('appends a wildcard to search query when `queryType` is `prefixLast`', () => {
    expect(getQueryString('test', {queryType: 'prefixLast'})).toEqual('test*')
    expect(getQueryString('', {queryType: 'prefixLast'})).toEqual('*')
  })

  it('appends no wildcard to search query when `queryType` is `prefixNone`', () => {
    expect(getQueryString('test', {queryType: 'prefixNone'})).toEqual('test')
    expect(getQueryString('', {queryType: 'prefixNone'})).toEqual('')
  })
})

describe('isNegationToken', () => {
  it('identifies negation tokens', () => {
    expect(isNegationToken('-test')).toBe(true)
    expect(isNegationToken('--')).toBe(true)
    expect(isNegationToken('test')).toBe(false)
    expect(isNegationToken('test-')).toBe(false)
    expect(isNegationToken(undefined)).toBe(false)
  })
})

describe('isPrefixToken', () => {
  it('identifies prefix tokens', () => {
    expect(isPrefixToken('test*')).toBe(true)
    expect(isPrefixToken('test')).toBe(false)
    expect(isPrefixToken('*test')).toBe(false)
    expect(isPrefixToken(undefined)).toBe(false)
  })
})

describe('prefixLast', () => {
  it('transforms the final non-negation token into a wildcard prefix', () => {
    expect(prefixLast('a')).toBe('a*')
    expect(prefixLast('a b')).toBe('a b*')
    expect(prefixLast('a -b')).toBe('a* -b')
    expect(prefixLast('a "bc" d')).toBe('a "bc" d*')
    expect(prefixLast('ab "cd"')).toBe('ab "cd"*')
    expect(prefixLast('a --')).toBe('a* --')
  })

  it('does not transform the final non-negation token if it is already a wildcard prefix', () => {
    expect(prefixLast('a*')).toBe('a*')
    expect(prefixLast('a* -b')).toBe('a* -b')
  })

  it('does not transform any tokens if only negation tokens are present', () => {
    expect(prefixLast('-a -b')).toBe('-a -b')
    expect(prefixLast('--')).toBe('--')
  })

  it('trims tokens', () => {
    expect(prefixLast('a   "ab   c"   d')).toBe('a "ab   c" d*')
  })

  it('preserves quoted tokens', () => {
    expect(prefixLast('"a b" c d')).toBe('"a b" c d*')
    expect(prefixLast('"a   b"   c d  "ef" "g  "')).toBe('"a   b" c d "ef" "g  "*')
    expect(prefixLast('"a " b" c d')).toBe('"a " b c d*')
  })
})
