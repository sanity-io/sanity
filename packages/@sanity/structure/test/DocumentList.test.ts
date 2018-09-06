import {StructureBuilder as S} from '../src'
import serializeStructure from './util/serializeStructure'

test('builds document lists with only required properties', () => {
  expect(
    S.documentList({id: 'foo', title: 'Foo', options: {filter: '_type == "book"'}}).serialize({
      path: []
    })
  ).toMatchSnapshot()
})

test('throws if no id is set', () => {
  expect(() => S.documentList().serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if no filter is set', () => {
  expect(() =>
    S.documentList()
      .id('foo')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds document lists through setters', () => {
  expect(
    S.documentList()
      .id('books')
      .title('Books')
      .filter('_type == $type')
      .params({type: 'book'})
      .defaultLayout('card')
      .defaultOrdering([{field: 'title', direction: 'asc'}])
      .serialize()
  ).toMatchSnapshot()
})

test('builds document lists through setters (alt order)', () => {
  expect(
    S.documentList()
      .defaultOrdering([{field: 'title', direction: 'desc'}])
      .id('books')
      .title('Books')
      .filter('_type == $type')
      .params({type: 'book'})
      .serialize()
  ).toMatchSnapshot()
})

test('builds document lists through setters (alt order #2)', () => {
  expect(
    S.documentList()
      .params({type: 'book'})
      .defaultOrdering([{field: 'title', direction: 'desc'}])
      .id('books')
      .title('Books')
      .filter('_type == $type')
      .serialize()
  ).toMatchSnapshot()
})

test('default child resolver resolves to editor', done => {
  const list = S.documentList()
    .id('books')
    .title('Books')
    .filter('_type == $type')
    .params({type: 'book'})
    .serialize()

  const context = {parent: list, index: 1}
  serializeStructure(list.child, context, ['asoiaf-wow', context]).subscribe(child => {
    expect(child).toEqual({
      id: 'editor',
      type: 'document',
      options: {
        id: 'asoiaf-wow',
        type: 'book'
      }
    })
    done()
  })
})

test('builder is immutable', () => {
  const original = S.documentList()
  expect(original.id('foo')).not.toEqual(original)
  expect(original.title('foo')).not.toEqual(original)
  expect(original.filter('foo == "bar"')).not.toEqual(original)
  expect(original.params({foo: 'bar'})).not.toEqual(original)
  expect(original.menuItems([])).not.toEqual(original)
  expect(original.menuItemGroups([])).not.toEqual(original)
  expect(original.defaultLayout('card')).not.toEqual(original)
  expect(original.child(() => undefined)).not.toEqual(original)
  expect(original.canHandleIntent(() => false)).not.toEqual(original)
  expect(original.defaultOrdering([{field: 'title', direction: 'asc'}])).not.toEqual(original)
})

test('getters work', () => {
  const original = S.documentList()
  const child = () => undefined
  const canHandleIntent = () => false
  const field = 'title'
  const direction = 'asc'
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
  expect(original.filter('foo == "bar"').getFilter()).toEqual('foo == "bar"')
  expect(original.params({foo: 'bar'}).getParams()).toEqual({foo: 'bar'})
  expect(original.menuItems([]).getMenuItems()).toEqual([])
  expect(original.menuItemGroups([]).getMenuItemGroups()).toEqual([])
  expect(original.defaultLayout('card').getDefaultLayout()).toEqual('card')
  expect(original.child(child).getChild()).toEqual(child)
  expect(original.canHandleIntent(canHandleIntent).getCanHandleIntent()).toEqual(canHandleIntent)
  expect(original.defaultOrdering([{field, direction}]).getDefaultOrdering()).toEqual([
    {field, direction}
  ])
})
