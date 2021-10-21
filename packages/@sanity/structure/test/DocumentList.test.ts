import {StructureBuilder as S} from '../src'
import serializeStructure from './util/serializeStructure'

test('builds document lists with only required properties', () => {
  expect(
    S.documentList({id: 'foo', title: 'Foo', options: {filter: '_type == "book"'}}).serialize({
      path: [],
    })
  ).toMatchSnapshot()
})

test('throws if no id is set', () => {
  expect(() => S.documentList().serialize()).toThrowErrorMatchingSnapshot()
})

test('infers ID from title if not specified', () => {
  expect(S.documentList().title('Hei der').getId()).toEqual('heiDer')
  expect(S.documentList().id('zing').title('Hei der').getId()).toEqual('zing')
  expect(S.documentList().title('Hei der').id('blah').getId()).toEqual('blah')
})

test('throws if no filter is set', () => {
  expect(() => S.documentList().id('foo').serialize()).toThrowErrorMatchingSnapshot()
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

test('builds document lists with custom api version', () => {
  expect(
    S.documentList()
      .id('pets')
      .title('Pets')
      .filter('_type == $type && count(humanAssociates[name == $human]) > 0')
      .params({type: 'pet', human: 'Espen'})
      .apiVersion('v2021-09-17')
      .defaultLayout('detail')
      .defaultOrdering([{field: 'title', direction: 'asc'}])
      .serialize()
  ).toMatchSnapshot()
})

test('default child resolver resolves to editor', (done) => {
  const list = S.documentList()
    .id('books')
    .title('Books')
    .filter('_type == $type')
    .params({type: 'book'})
    .serialize()

  const context = {parent: list, index: 1}
  serializeStructure(list.child, context, ['asoiaf-wow', context]).subscribe((child) => {
    expect(child).toMatchObject({
      id: 'documentEditor',
      type: 'document',
      options: {
        id: 'asoiaf-wow',
        type: 'book',
      },
      views: [
        {
          id: 'editor',
          title: 'Editor',
          type: 'form',
          icon: undefined,
        },
      ],
    })
    done()
  })
})

test('builder is immutable', () => {
  const original = S.documentList()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.filter('foo == "bar"')).not.toBe(original)
  expect(original.apiVersion('v1')).not.toBe(original)
  expect(original.params({foo: 'bar'})).not.toBe(original)
  expect(original.menuItems([])).not.toBe(original)
  expect(original.showIcons(false)).not.toBe(original)
  expect(original.menuItemGroups([])).not.toBe(original)
  expect(original.defaultLayout('card')).not.toBe(original)
  expect(original.child(() => undefined)).not.toBe(original)
  expect(original.canHandleIntent(() => false)).not.toBe(original)
  expect(original.defaultOrdering([{field: 'title', direction: 'asc'}])).not.toBe(original)
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
  expect(original.apiVersion('v2021-03-25').getApiVersion()).toEqual('v2021-03-25')
  expect(original.params({foo: 'bar'}).getParams()).toEqual({foo: 'bar'})
  expect(original.menuItems([]).getMenuItems()).toEqual([])
  expect(original.menuItemGroups([]).getMenuItemGroups()).toEqual([])
  expect(original.defaultLayout('card').getDefaultLayout()).toEqual('card')
  expect(original.child(child).getChild()).toEqual(child)
  expect(original.showIcons(false).getShowIcons()).toEqual(false)
  expect(original.canHandleIntent(canHandleIntent).getCanHandleIntent()).toEqual(canHandleIntent)
  expect(original.defaultOrdering([{field, direction}]).getDefaultOrdering()).toEqual([
    {field, direction},
  ])
})

test('can disable icons from being displayed', () => {
  const list = S.documentList().title('Blåmuggost').filter('_type == "bluecheese"').showIcons(false)

  expect(list.serialize()).toMatchObject({
    id: 'blamuggost',
    displayOptions: {showIcons: false},
  })

  expect(list.getShowIcons()).toBe(false)
})
