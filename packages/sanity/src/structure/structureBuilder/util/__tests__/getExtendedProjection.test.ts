import {Schema} from '@sanity/schema'
import {type SchemaType, type SortOrderingItem} from '@sanity/types'
import {describe, expect, test, vi} from 'vitest'

import {getExtendedProjection} from '../getExtendedProjection'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {
          name: 'bestFriend',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'editor',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {
          name: 'bestFriend',
          type: 'reference',
          to: [{type: 'editor'}],
        },
      ],
    },
    {
      name: 'sanity.imageAsset',
      type: 'document',
      fields: [{name: 'size', type: 'number'}],
    },
    {
      name: 'arrayOrderingValue',
      type: 'document',
      fields: [{name: 'value', type: 'string'}],
    },
    {
      name: 'withObjectFieldsOrder',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'publicationYear', type: 'number'},
        {
          name: 'translations',
          type: 'object',
          fields: [
            {name: 'se', type: 'string'},
            {name: 'no', type: 'string'},
            {name: 'en', type: 'string'},
          ],
        },
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
        },
        {
          name: 'contributor',
          type: 'reference',
          to: [{type: 'author'}, {type: 'editor'}],
        },
        {
          name: 'coverImage',
          type: 'object',
          fields: [
            {
              name: 'asset',
              type: 'reference',
              to: [{type: 'sanity.imageAsset'}],
            },
          ],
        },
        {
          name: 'vehicleModel',
          type: 'object',
          fields: [
            {name: 'make', type: 'string'},
            {name: 'model', type: 'string'},
          ],
        },
      ],
    },
    {
      name: 'withArrayFields',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {
          name: 'items',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'arrayOrderingValue'}]}],
        },
        {
          name: 'tags',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [{name: 'label', type: 'string'}],
            },
          ],
        },
        {
          name: 'mixedContent',
          type: 'array',
          of: [{type: 'string'}, {type: 'number'}],
        },
      ],
    },
  ],
})

const withObjectFieldsOrder = mockSchema.get('withObjectFieldsOrder') as SchemaType
const withArrayFields = mockSchema.get('withArrayFields') as SchemaType

describe('getExtendedProjection', () => {
  test('keeps simple field ordering projection', () => {
    const orderBy: SortOrderingItem[] = [{field: 'publicationYear', direction: 'asc'}]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe('publicationYear')
  })

  test('merges multiple ordered fields from the same object path', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'translations.se', direction: 'asc'},
      {field: 'translations.no', direction: 'asc'},
      {field: 'title', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe(
      'translations{se, no}, title',
    )
  })

  test('merges multiple ordered fields from the same reference path', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'author.name', direction: 'asc'},
      {field: 'author.bestFriend.name', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe(
      'author->{name, bestFriend->{name}}',
    )
  })

  test('merges and deduplicates projections for multi-type references', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'contributor.name', direction: 'asc'},
      {field: 'contributor.bestFriend.name', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe(
      'contributor->{name, bestFriend->{name}}',
    )
  })

  test('does not duplicate fields when ordering contains repeated paths', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'title', direction: 'asc'},
      {field: 'translations.se', direction: 'asc'},
      {field: 'translations.no', direction: 'asc'},
      {field: 'title', direction: 'desc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe(
      'title, translations{se, no}',
    )
  })

  test('keeps order permutation projections merged for vehicle model fields', () => {
    const makeFirst: SortOrderingItem[] = [
      {field: 'vehicleModel.make', direction: 'asc'},
      {field: 'vehicleModel.model', direction: 'asc'},
    ]
    const modelFirst: SortOrderingItem[] = [
      {field: 'vehicleModel.model', direction: 'asc'},
      {field: 'vehicleModel.make', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, makeFirst)).toBe(
      'vehicleModel{make, model}',
    )
    expect(getExtendedProjection(withObjectFieldsOrder, modelFirst)).toBe(
      'vehicleModel{model, make}',
    )
  })

  test('keeps deep object-reference chain used in book schema orderings', () => {
    const orderBy: SortOrderingItem[] = [{field: 'coverImage.asset.size', direction: 'asc'}]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe('coverImage{asset->{size}}')
  })

  test('does not include implicit document fields in extended projection', () => {
    const orderBy: SortOrderingItem[] = [
      {field: '_updatedAt', direction: 'desc'},
      {field: 'title', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe('title')
  })

  test('ignores missing fields in non-strict mode while keeping valid paths', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const orderBy: SortOrderingItem[] = [
      {field: 'title', direction: 'asc'},
      {field: 'missingField', direction: 'asc'},
      {field: 'translations.se', direction: 'asc'},
    ]

    expect(getExtendedProjection(withObjectFieldsOrder, orderBy)).toBe('title, translations{se}')
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent field "missingField"'),
    )
  })

  test('throws in strict mode when ordering targets missing top-level field', () => {
    const orderBy: SortOrderingItem[] = [{field: 'missingField', direction: 'asc'}]

    expect(() => getExtendedProjection(withObjectFieldsOrder, orderBy, true)).toThrow(
      'The current ordering config targeted the nonexistent field "missingField"',
    )
  })

  test('throws in strict mode when ordering targets missing nested field', () => {
    const orderBy: SortOrderingItem[] = [{field: 'translations.fi', direction: 'asc'}]

    expect(() => getExtendedProjection(withObjectFieldsOrder, orderBy, true)).toThrow(
      'The current ordering config targeted the nonexistent field "fi"',
    )
  })

  test('throws in strict mode when traversing into a non-object schema type', () => {
    const orderBy: SortOrderingItem[] = [{field: 'title.foo', direction: 'asc'}]

    expect(() => getExtendedProjection(withObjectFieldsOrder, orderBy, true)).toThrow(
      'attempted to traverse into field "foo" on non-object schema type',
    )
  })

  test('handles array index with reference dereference', () => {
    const orderBy: SortOrderingItem[] = [{field: 'items[0].value', direction: 'asc'}]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('items[0]->{value}')
  })

  test('handles array index with object field access', () => {
    const orderBy: SortOrderingItem[] = [{field: 'tags[0].label', direction: 'asc'}]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('tags[0]{label}')
  })

  test('handles array index as leaf without further nesting', () => {
    const orderBy: SortOrderingItem[] = [{field: 'tags[0]', direction: 'asc'}]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('tags[0]')
  })

  test('handles mixed array and non-array orderings', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'items[0].value', direction: 'asc'},
      {field: 'title', direction: 'asc'},
    ]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('items[0]->{value}, title')
  })

  test('throws in strict mode when array access is used on non-array field', () => {
    const orderBy: SortOrderingItem[] = [{field: 'title[0]', direction: 'asc'}]

    expect(() => getExtendedProjection(withArrayFields, orderBy, true)).toThrow(
      'used array access on non-array field "title"',
    )
  })

  test('handles keyed segment with reference dereference', () => {
    const orderBy: SortOrderingItem[] = [{field: 'items[_key=="abc"].value', direction: 'asc'}]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('items[_key=="abc"]->{value}')
  })

  test('throws in strict mode when array access is used on multi-type array with nested path', () => {
    const orderBy: SortOrderingItem[] = [{field: 'mixedContent[0].nested', direction: 'asc'}]

    expect(() => getExtendedProjection(withArrayFields, orderBy, true)).toThrow(
      'Array ordering requires a single member type',
    )
  })

  test('throws in strict mode when range slice is used in ordering', () => {
    const orderBy: SortOrderingItem[] = [{field: 'items[0:5].value', direction: 'asc'}]

    expect(() => getExtendedProjection(withArrayFields, orderBy, true)).toThrow(
      'Range slices are not supported for ordering',
    )
  })

  test('upgrades existing non-reference node to reference when same key is reused', () => {
    const orderBy: SortOrderingItem[] = [
      {field: 'items[0]', direction: 'asc'},
      {field: 'items[0].value', direction: 'asc'},
    ]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('items[0]->{value}')
  })

  test('skips empty field strings gracefully', () => {
    const orderBy: SortOrderingItem[] = [
      {field: '', direction: 'asc'},
      {field: 'title', direction: 'asc'},
    ]

    expect(getExtendedProjection(withArrayFields, orderBy)).toBe('title')
  })
})
