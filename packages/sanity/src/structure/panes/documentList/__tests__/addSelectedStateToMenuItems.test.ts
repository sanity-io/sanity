import {Schema} from '@sanity/schema'
import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {type PaneMenuItem} from '../../../types'
import {addSelectedStateToMenuItems} from '../PaneContainer'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'category',
      title: 'Category',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

const categorySchemaType = mockSchema.get('category') as ObjectSchemaType

describe('addSelectedStateToMenuItems', () => {
  describe('sort order disabled state', () => {
    test('does not disable menu items when sort fields exist in schema', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by title',
          params: {by: [{field: 'title', direction: 'asc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].disabled).toBeUndefined()
    })

    test('disables menu items when sort fields do not exist in schema', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by nonExistent',
          params: {by: [{field: 'nonExistentField', direction: 'asc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].disabled).toEqual({reason: 'Sort order invalid'})
    })

    test('does not disable menu items that sort by built-in fields', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by updated',
          params: {by: [{field: '_updatedAt', direction: 'desc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].disabled).toBeUndefined()
    })

    test('does not disable sort items when schemaType is undefined', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by anything',
          params: {by: [{field: 'anyField', direction: 'asc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        schemaType: undefined,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].disabled).toBeUndefined()
    })

    test('disables only invalid sort items in a mixed list', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by title',
          params: {by: [{field: 'title', direction: 'asc' as const}]},
        },
        {
          title: 'Sort by nonExistent',
          params: {by: [{field: 'nonExistentField', direction: 'asc' as const}]},
        },
        {
          title: 'Sort by updated',
          params: {by: [{field: '_updatedAt', direction: 'desc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(3)
      expect(result![0].disabled).toBeUndefined()
      expect(result![1].disabled).toEqual({reason: 'Sort order invalid'})
      expect(result![2].disabled).toBeUndefined()
    })

    test('does not affect layout menu items', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Compact view',
          params: {layout: 'compact'},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        layout: 'default',
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].disabled).toBeUndefined()
    })

    test('preserves selected state alongside disabled state', () => {
      const menuItems: PaneMenuItem[] = [
        {
          title: 'Sort by nonExistent',
          params: {by: [{field: 'nonExistentField', direction: 'asc' as const}]},
        },
      ]

      const result = addSelectedStateToMenuItems({
        menuItems,
        sortOrderRaw: {by: [{field: 'nonExistentField', direction: 'asc' as const}]},
        schemaType: categorySchemaType,
        disabledSortReason: 'Sort order invalid',
      })

      expect(result).toHaveLength(1)
      expect(result![0].selected).toBe(true)
      expect(result![0].disabled).toEqual({reason: 'Sort order invalid'})
    })
  })
})
