import {describe, expect, it} from '@jest/globals'
import {Schema} from '@sanity/schema'
import {defineField, defineType} from '@sanity/types'

import {getDocumentTypeConfiguration, getSort} from './createTextSearch'

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
      getSort([
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
        title: {
          order: 'desc',
        },
      },
      {
        _createdAt: {
          order: 'asc',
        },
      },
    ])
  })
})
