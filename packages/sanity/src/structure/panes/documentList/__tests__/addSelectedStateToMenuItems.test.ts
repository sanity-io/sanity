import {Schema} from '@sanity/schema'
import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {type PaneMenuItem} from '../../../types'
import {addSelectedStateToMenuItems, appendRestoreDefaultItems} from '../PaneContainer'

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

describe('appendRestoreDefaultItems', () => {
  const restoreOptions = {
    isSortDefault: false,
    isLayoutDefault: false,
    restoreSortDisabledReason: 'Already using the default sort order',
    restoreLayoutDisabledReason: 'Already using the default view',
  }

  // Restore items are only attached to groups that already have items.
  const baseMenuItems: PaneMenuItem[] = [
    {id: 'sort', title: 'Sort', group: 'sorting', action: 'setSortOrder'},
    {id: 'layout', title: 'Layout', group: 'layout', action: 'setLayout'},
  ]

  const restoreItemsOf = (items: PaneMenuItem[]) =>
    items.filter(
      (item) => item.action === 'restoreDefaultSortOrder' || item.action === 'restoreDefaultLayout',
    )

  test('appends a restore-default item to the sorting and layout groups', () => {
    const result = appendRestoreDefaultItems({menuItems: baseMenuItems, ...restoreOptions})

    expect(result).toHaveLength(4)
    expect(result[0]).toBe(baseMenuItems[0])

    const sortItem = result.find((item) => item.action === 'restoreDefaultSortOrder')
    const layoutItem = result.find((item) => item.action === 'restoreDefaultLayout')

    expect(sortItem).toMatchObject({group: 'sorting', action: 'restoreDefaultSortOrder'})
    expect(layoutItem).toMatchObject({group: 'layout', action: 'restoreDefaultLayout'})
  })

  test('hides the selection indicator on both restore items', () => {
    const result = restoreItemsOf(
      appendRestoreDefaultItems({menuItems: baseMenuItems, ...restoreOptions}),
    )

    expect(result).toHaveLength(2)
    expect(result.every((item) => item.params?.hideSelectionIndicator === true)).toBe(true)
  })

  test('restore items have no id so they do not trigger toggle-state tracking', () => {
    const result = restoreItemsOf(
      appendRestoreDefaultItems({menuItems: baseMenuItems, ...restoreOptions}),
    )

    expect(result.every((item) => item.id === undefined)).toBe(true)
  })

  test('restore items carry no icon', () => {
    const result = restoreItemsOf(
      appendRestoreDefaultItems({menuItems: baseMenuItems, ...restoreOptions}),
    )

    expect(result.every((item) => item.icon === undefined)).toBe(true)
  })

  test('appends nothing when there are no groups to attach to', () => {
    const result = appendRestoreDefaultItems(restoreOptions)

    expect(result).toHaveLength(0)
  })

  test('disables only the sort restore item when sort is already default', () => {
    const result = appendRestoreDefaultItems({
      menuItems: baseMenuItems,
      ...restoreOptions,
      isSortDefault: true,
    })

    const sortItem = result.find((item) => item.action === 'restoreDefaultSortOrder')
    const layoutItem = result.find((item) => item.action === 'restoreDefaultLayout')

    expect(sortItem!.disabled).toEqual({reason: 'Already using the default sort order'})
    expect(layoutItem!.disabled).toBeUndefined()
  })

  test('disables only the layout restore item when layout is already default', () => {
    const result = appendRestoreDefaultItems({
      menuItems: baseMenuItems,
      ...restoreOptions,
      isLayoutDefault: true,
    })

    const sortItem = result.find((item) => item.action === 'restoreDefaultSortOrder')
    const layoutItem = result.find((item) => item.action === 'restoreDefaultLayout')

    expect(layoutItem!.disabled).toEqual({reason: 'Already using the default view'})
    expect(sortItem!.disabled).toBeUndefined()
  })

  test('leaves both restore items enabled when neither setting is default', () => {
    const result = restoreItemsOf(
      appendRestoreDefaultItems({menuItems: baseMenuItems, ...restoreOptions}),
    )

    expect(result.every((item) => item.disabled === undefined)).toBe(true)
  })
})
