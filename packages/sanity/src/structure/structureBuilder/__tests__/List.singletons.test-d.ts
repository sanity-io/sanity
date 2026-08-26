import {expectTypeOf, test} from 'vitest'

import {type SingletonListBuilder} from '../List'
import {type ListItemBuilder} from '../ListItem'
import {type StructureBuilder} from '../types'

declare const S: StructureBuilder

test('S.list().singletons() omits `items` from the returned builder type', () => {
  const list = S.list().singletons(['settings'])
  expectTypeOf(list).toEqualTypeOf<SingletonListBuilder>()
  expectTypeOf(list).not.toHaveProperty('items')
})

test('the `items` omission is sticky across further chaining', () => {
  const list = S.list().singletons(['settings'])
  expectTypeOf(list.title('Singletons')).not.toHaveProperty('items')
  expectTypeOf(list.id('singletons').showIcons(false)).not.toHaveProperty('items')
  // Repeated `.singletons()` calls remain available (and remain narrowed).
  expectTypeOf(list.singletons(['navigation'])).not.toHaveProperty('items')
})

test('.items() before .singletons() still type-checks', () => {
  const list = S.list().items([]).singletons(['settings'])
  expectTypeOf(list).toEqualTypeOf<SingletonListBuilder>()
})

test('SingletonListBuilder is accepted as a list item child', () => {
  const item = S.listItem()
    .id('settings')
    .child(S.list().singletons(['settings']))
  expectTypeOf(item).toEqualTypeOf<ListItemBuilder>()
})

test('SingletonListBuilder still exposes serialization', () => {
  const list = S.list().id('singletons').title('Singletons').singletons(['settings'])
  expectTypeOf(list.serialize).toBeFunction()
  expectTypeOf(list.getItems).toBeFunction()
})
