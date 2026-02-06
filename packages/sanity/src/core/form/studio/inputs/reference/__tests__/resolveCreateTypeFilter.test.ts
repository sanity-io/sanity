import {
  type ReferenceSchemaType,
  type ReferenceTypeFilter,
  type ReferenceTypeFilterContext,
  type ReferenceTypeOption,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, test, vi} from 'vitest'

import {resolveCreateTypeFilter} from '../resolveCreateTypeFilter'

// Helper to create a minimal schema type for testing
function createSchemaType(
  toTypes: string[],
  filterTypes?: ReferenceTypeFilter,
): ReferenceSchemaType {
  return {
    to: toTypes.map((name) => ({name, type: name, title: name})),
    options: filterTypes ? {filterTypes} : undefined,
  } as ReferenceSchemaType
}

// Helper to create a minimal document for testing
function createTestDocument(props: Partial<SanityDocument>): SanityDocument {
  return {
    _id: 'doc1',
    _type: 'test',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: 'rev1',
    ...props,
  }
}

describe('resolveCreateTypeFilter', () => {
  describe('backward compatibility', () => {
    test('returns all types when no filterTypes option provided', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author', 'editor']),
        document: createTestDocument({}),
        valuePath: ['someRef'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}, {type: 'editor'}])
    })

    test('returns all types when options is undefined', () => {
      const schemaType: ReferenceSchemaType = {
        to: [{name: 'book', type: 'book', title: 'Book'}],
      } as ReferenceSchemaType
      const result = resolveCreateTypeFilter({
        schemaType,
        document: createTestDocument({}),
        valuePath: ['someRef'],
      })

      expect(result).toEqual([{type: 'book'}])
    })
  })

  describe('filter function execution', () => {
    test('passes correct context and toTypes to filter function', () => {
      const filterTypes = vi.fn().mockReturnValue([{type: 'book'}])

      const document = createTestDocument({category: 'fiction'})

      resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], filterTypes),
        document,
        valuePath: ['creator'],
      })

      expect(filterTypes).toHaveBeenCalledWith(
        {
          document,
          parent: document,
          parentPath: [],
        },
        [{type: 'book'}, {type: 'author'}],
      )
    })

    test('resolves parent correctly for nested paths', () => {
      const filterTypes = vi.fn().mockReturnValue([{type: 'book'}])

      const document = createTestDocument({
        nested: {field: 'value', ref: null},
      })

      resolveCreateTypeFilter({
        schemaType: createSchemaType(['book'], filterTypes),
        document,
        valuePath: ['nested', 'ref'],
      })

      expect(filterTypes).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: {field: 'value', ref: null},
          parentPath: ['nested'],
        }),
        [{type: 'book'}],
      )
    })

    test('returns filtered types when filter returns valid subset', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author', 'editor'], (_ctx, toTypes) =>
          toTypes.filter((t) => t.type === 'book' || t.type === 'author'),
        ),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
    })

    test('filters based on document values', () => {
      const filterTypes = (
        {document}: ReferenceTypeFilterContext,
        toTypes: ReferenceTypeOption[],
      ): ReferenceTypeOption[] => {
        return document.category === 'fiction'
          ? toTypes.filter((t) => t.type === 'novel' || t.type === 'story')
          : toTypes.filter((t) => t.type === 'manual' || t.type === 'guide')
      }

      const resultFiction = resolveCreateTypeFilter({
        schemaType: createSchemaType(['novel', 'story', 'manual', 'guide'], filterTypes),
        document: createTestDocument({_id: 'doc1', category: 'fiction'}),
        valuePath: ['ref'],
      })

      const resultNonFiction = resolveCreateTypeFilter({
        schemaType: createSchemaType(['novel', 'story', 'manual', 'guide'], filterTypes),
        document: createTestDocument({_id: 'doc2', category: 'nonfiction'}),
        valuePath: ['ref'],
      })

      expect(resultFiction).toEqual([{type: 'novel'}, {type: 'story'}])
      expect(resultNonFiction).toEqual([{type: 'manual'}, {type: 'guide'}])
    })

    test('filterTypes does not affect search behavior (filter isolation)', () => {
      const filterTypes = vi.fn().mockReturnValue([{type: 'book'}])
      const filter = vi.fn()

      const schemaType: ReferenceSchemaType = {
        to: [
          {name: 'book', type: 'book', title: 'Book'},
          {name: 'author', type: 'author', title: 'Author'},
        ],
        options: {
          filterTypes,
          filter,
        },
      } as ReferenceSchemaType

      resolveCreateTypeFilter({
        schemaType,
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(filterTypes).toHaveBeenCalled()
      expect(filter).not.toHaveBeenCalled()
    })
  })

  describe('error handling and fallbacks', () => {
    test('returns all types when filter throws error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], () => {
          throw new Error('Filter failed')
        }),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in reference filterTypes function'),
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    test('returns all types when filter returns empty array', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], () => []),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
    })

    test('returns all types when filter returns non-array', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], () => 'book' as any),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('filterTypes must return an array'),
      )

      consoleSpy.mockRestore()
    })

    test('filters out invalid type names not in schema', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], (_ctx, toTypes) => [
          ...toTypes.filter((t) => t.type === 'book'),
          {type: 'invalid'},
          {type: 'notreal'},
        ]),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}])
    })

    test('returns all types when all filtered types are invalid', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author'], () => [
          {type: 'invalid'},
          {type: 'notreal'},
        ]),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
    })

    test('returns all types when filter returns objects without type property', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(
          ['book', 'author'],
          () => [{name: 'book'}, {foo: 'bar'}] as any,
        ),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('filterTypes returned invalid object without type property'),
        expect.anything(),
      )

      consoleSpy.mockRestore()
    })

    test('verifies toTypes parameter structure', () => {
      const filterTypes = vi.fn().mockReturnValue([{type: 'book'}])

      resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author', 'editor'], filterTypes),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      const toTypesArg = filterTypes.mock.calls[0][1] as ReferenceTypeOption[]
      expect(toTypesArg).toEqual([{type: 'book'}, {type: 'author'}, {type: 'editor'}])
      expect(toTypesArg.every((item) => typeof item === 'object' && 'type' in item)).toBe(true)
    })

    test('supports passthrough behavior returning toTypes unmodified', () => {
      const result = resolveCreateTypeFilter({
        schemaType: createSchemaType(['book', 'author', 'editor'], (_ctx, toTypes) => toTypes),
        document: createTestDocument({}),
        valuePath: ['ref'],
      })

      expect(result).toEqual([{type: 'book'}, {type: 'author'}, {type: 'editor'}])
    })
  })
})
