import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {DocumentListItemBuilder} from '../DocumentListItem'
import {type StructureContext} from '../types'

const schemaType = {name: 'author', title: 'Author'} as SchemaType

const mockContext = {
  i18n: {
    t: (key: string) => key,
  },
} as unknown as StructureContext

describe('DocumentListItemBuilder', () => {
  it('uses the default document child resolver when child is omitted', () => {
    const serialized = new DocumentListItemBuilder(mockContext)
      .id('author-1')
      .title('Author')
      .schemaType(schemaType)
      .serialize()

    expect(typeof serialized.child).toBe('function')
  })

  it('serializes an explicit null child as a silent leaf', () => {
    const serialized = new DocumentListItemBuilder(mockContext)
      .id('author-1')
      .title('Author')
      .schemaType(schemaType)
      .child(null)
      .serialize()

    expect(serialized.child).toBeNull()
  })
})
