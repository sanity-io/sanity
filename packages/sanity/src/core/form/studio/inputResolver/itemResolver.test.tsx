import {type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'
import {describe, expect, it} from 'vitest'

import {PreviewItem} from '../../inputs/arrays/ArrayOfObjectsInput/List/PreviewItem'
import {ItemRow} from '../../inputs/arrays/ArrayOfPrimitivesInput/ItemRow'
import {type ItemProps} from '../../types/itemProps'
import {defaultResolveItemComponent} from './itemResolver'

function CustomItem() {
  return null
}

describe('defaultResolveItemComponent', () => {
  it('uses schemaType.components.item when provided on a primitive type', () => {
    const schemaType = {
      name: 'string',
      jsonType: 'string',
      components: {item: CustomItem},
    } as SchemaType

    expect(defaultResolveItemComponent(schemaType)).toBe(CustomItem)
  })

  it('defaults primitive types to ItemRow', () => {
    const schemaType = {name: 'string', jsonType: 'string'} as SchemaType

    expect(defaultResolveItemComponent(schemaType)).toBe(
      ItemRow as ComponentType<Omit<ItemProps, 'renderDefault'>>,
    )
  })

  it('defaults object types to PreviewItem', () => {
    const schemaType = {name: 'object', jsonType: 'object'} as SchemaType

    expect(defaultResolveItemComponent(schemaType)).toBe(PreviewItem)
  })
})
