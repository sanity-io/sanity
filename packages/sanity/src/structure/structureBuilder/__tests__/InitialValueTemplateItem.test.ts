import {describe, expect, it} from 'vitest'

import {InitialValueTemplateItemBuilder} from '../InitialValueTemplateItem'
import {type StructureContext} from '../types'

// Minimal mock of StructureContext for testing
const mockContext = {
  templates: [{id: 'my-template', title: 'My template', schemaType: 'myType'}],
} as unknown as StructureContext

describe('InitialValueTemplateItemBuilder', () => {
  describe('templateId()', () => {
    it('should serialize the template id when it matches the item id', () => {
      const serialized = new InitialValueTemplateItemBuilder(mockContext)
        .templateId('my-template')
        .serialize()

      expect(serialized.id).toBe('my-template')
      expect(serialized.templateId).toBe('my-template')
    })

    it('should keep the template id when the item has its own id', () => {
      const serialized = new InitialValueTemplateItemBuilder(mockContext)
        .id('my-template-variant-a')
        .templateId('my-template')
        .serialize()

      expect(serialized.id).toBe('my-template-variant-a')
      expect(serialized.templateId).toBe('my-template')
    })

    it('should let several items share one template while keeping distinct ids', () => {
      const items = ['a', 'b', 'c'].map((variant) =>
        new InitialValueTemplateItemBuilder(mockContext)
          .id(`my-template-${variant}`)
          .templateId('my-template')
          .parameters({variant})
          .serialize(),
      )

      expect(new Set(items.map((item) => item.id)).size).toBe(3)
      expect(new Set(items.map((item) => item.templateId))).toEqual(new Set(['my-template']))
      expect(items.map((item) => item.parameters)).toEqual([
        {variant: 'a'},
        {variant: 'b'},
        {variant: 'c'},
      ])
    })
  })
})
