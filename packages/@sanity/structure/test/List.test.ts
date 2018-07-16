import {StructureBuilder as S} from '../src'
import {Layout} from '../src/Layout'

const noop = () => {
  /* intentional noop */
}

test('builds lists with only required props', () => {
  expect(S.list({id: 'foo', title: 'Foo'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  expect(() => S.list().serialize()).toThrowErrorMatchingSnapshot()
})

test('builds lists with ID and title through setters', () => {
  expect(
    S.list({id: 'books', title: 'Books'})
      .id('authors')
      .title('Authors')
      .serialize()
  ).toMatchSnapshot()
})

test('builds lists with specific items', () => {
  expect(
    S.list()
      .id('books')
      .items([{id: 'asoiaf-wow', title: 'The Winds of Winter'}])
      .serialize()
  ).toMatchSnapshot()
})

test('builds lists where items are specified using builder', () => {
  expect(
    S.list()
      .id('books')
      .items([S.listItem({id: 'foo', title: 'Foo'})])
      .serialize()
  ).toMatchSnapshot()
})

test('builds lists with layout', () => {
  expect(
    S.list()
      .id('books')
      .defaultLayout('card')
      .serialize()
  ).toMatchSnapshot()
})

test('default child resolver can resolve directly to node', () => {
  const item = {
    id: 'asoiaf-wow',
    title: 'The Winds of Winter',
    child: {id: 'editor', type: 'document', options: {id: 'wow', type: 'book'}}
  }

  const list = S.list()
    .id('books')
    .items([item])
    .serialize()

  return expect(list.resolveChildForItem(item.id, list, {index: 0})).resolves.toEqual(item.child)
})

test('default child resolver can resolve through promise', () => {
  const child = {id: 'editor', type: 'document', options: {id: 'wow', type: 'book'}}
  const item = {
    id: 'asoiaf-wow',
    title: 'The Winds of Winter',
    child: () => Promise.resolve(child)
  }

  const list = S.list()
    .id('books')
    .items([item])
    .serialize()

  return expect(list.resolveChildForItem(item.id, list, {index: 0})).resolves.toEqual(child)
})

test('can provide custom child resolver', () => {
  const list = S.list()
    .id('books')
    .items([{id: 'today', title: 'Today'}])
    .childResolver(() => ({
      id: 'editor',
      type: 'editor',
      options: {id: new Date().toISOString().slice(0, 10), type: 'gallery'}
    }))
    .serialize()

  return expect(list.resolveChildForItem('today', list, {index: 0})).resolves.toHaveProperty(
    'options.id',
    new Date().toISOString().slice(0, 10)
  )
})

test('can resolve undefined child', () => {
  const list = S.list()
    .id('books')
    .items([{id: 'today', title: 'Today'}])
    .childResolver(() => undefined)
    .serialize()

  return expect(list.resolveChildForItem('today', list, {index: 0})).resolves.toBe(undefined)
})

test('can set menu items', () => {
  expect(
    S.list()
      .id('yeah')
      .menuItems([{title: 'Print', action: noop}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items with builder', () => {
  expect(
    S.list()
      .id('yeah')
      .menuItems([
        S.menuItem()
          .title('Purge')
          .action(noop)
      ])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu item groups', () => {
  expect(
    S.list()
      .id('yeah')
      .menuItems([{title: 'Print', action: noop, group: 'old-school'}])
      .menuItemGroups([{title: 'Old-school', id: 'old-school'}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items groups with builder', () => {
  expect(
    S.list()
      .id('yeah')
      .menuItems([
        S.menuItem()
          .title('Print')
          .action(noop)
          .group('old-school')
      ])
      .menuItemGroups([
        S.menuItemGroup()
          .id('old-school')
          .title('Old-school')
      ])
      .serialize()
  ).toMatchSnapshot()
})

test('can set intent handler check', () => {
  const handler = () => false
  expect(
    S.list()
      .id('yeah')
      .canHandleIntent(handler)
      .serialize()
  ).toMatchObject({canHandleIntent: handler})
})
