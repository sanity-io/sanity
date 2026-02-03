import {describe, expect, it} from 'vitest'

import {MenuItemBuilder} from '../MenuItem'
import {type StructureContext} from '../types'

// Minimal mock of StructureContext for testing
const mockContext = {
  i18n: {
    t: (key: string) => key,
  },
} as unknown as StructureContext

describe('MenuItemBuilder', () => {
  describe('id()', () => {
    it('should set and get the id', () => {
      const builder = new MenuItemBuilder(mockContext)
        .id('my-menu-item')
        .title('My Menu Item')
        .action('myAction')

      expect(builder.getId()).toBe('my-menu-item')
    })

    it('should include id in serialized output', () => {
      const builder = new MenuItemBuilder(mockContext)
        .id('my-menu-item')
        .title('My Menu Item')
        .action('myAction')

      const serialized = builder.serialize()

      expect(serialized.id).toBe('my-menu-item')
      expect(serialized.title).toBe('My Menu Item')
      expect(serialized.action).toBe('myAction')
    })

    it('should work with setMenuItemState action pattern', () => {
      const builder = new MenuItemBuilder(mockContext)
        .id('filterStatus')
        .title('Show Published')
        .action('setMenuItemState')
        .params({id: 'filterStatus', value: 'published'})

      const serialized = builder.serialize()

      expect(serialized.id).toBe('filterStatus')
      expect(serialized.action).toBe('setMenuItemState')
      expect(serialized.params).toEqual({id: 'filterStatus', value: 'published'})
    })

    it('should preserve id when cloning', () => {
      const builder = new MenuItemBuilder(mockContext)
        .id('original-id')
        .title('Original Title')
        .action('originalAction')

      const cloned = builder.clone({title: 'New Title'})

      expect(cloned.getId()).toBe('original-id')
      expect(cloned.getTitle()).toBe('New Title')
    })
  })
})
