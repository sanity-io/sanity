import {flatten} from 'lodash'
import {createStructureBuilder} from '../src'
import {serializeStructure} from './util/serializeStructure'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

const noop = () => {
  /* intentional noop */
}

test('builds lists with only required props', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.list({id: 'foo', title: 'Foo'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.list().serialize()).toThrowErrorMatchingSnapshot()
})

test('builds lists with ID and title through setters', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list({id: 'books', title: 'Books'}).id('authors').title('Authors').serialize()
  ).toMatchSnapshot()
})

test('builds lists with specific items', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('books')
      .items([{id: 'asoiaf-wow', title: 'The Winds of Winter', type: 'listItem'}])
      .serialize()
  ).toMatchSnapshot()
})

test('builds lists where items are specified using builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('books')
      .items([S.listItem({id: 'foo', title: 'Foo'})])
      .serialize()
  ).toMatchSnapshot()
})

test('enforces unique IDs', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() =>
    S.list()
      .id('books')
      .items([S.listItem({id: 'foo', title: 'Foo'}), S.listItem().title('Foo')])
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('enforces unique IDs (more than one dupe, caps max items)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() =>
    S.list()
      .id('books')
      .items(
        flatten(
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [
            S.listItem().title(`Zing ${i}`),
            S.listItem().title(`Zing ${i}`),
          ])
        )
      )
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds lists with layout', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.list().id('books').defaultLayout('card').serialize()).toMatchSnapshot()
})

test('default child resolver can resolve directly to node', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const item = {
    id: 'asoiaf-wow',
    title: 'The Winds of Winter',
    child: {id: 'editor', type: 'document', options: {id: 'wow', type: 'book'}},
    type: 'listItem',
  }

  const list = S.list().id('books').items([item]).serialize()

  const resolverContext = {structureBuilder: S, client} as any
  const context = {parent: list, index: 0}
  serializeStructure(list.child, context, [resolverContext, item.id, context]).subscribe(
    (child) => {
      expect(child).toEqual(item.child)
      done()
    }
  )
})

test('default child resolver can resolve through promise', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const child = {id: 'editor', type: 'document', options: {id: 'wow', type: 'book'}}
  const item = {
    id: 'asoiaf-wow',
    title: 'The Winds of Winter',
    child: () => Promise.resolve(child),
    type: 'listItem',
  }

  const list = S.list().id('books').items([item]).serialize()

  const context = {parent: list, index: 0}
  const resolverContext = {structureBuilder: S, client} as any
  serializeStructure(list.child, context, [resolverContext, item.id, context]).subscribe(
    (itemChild) => {
      expect(itemChild).toEqual(child)
      done()
    }
  )
})

test('can provide custom child resolver', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const list = S.list()
    .id('books')
    .items([{id: 'today', title: 'Today', type: 'listItem'}])
    .child(() => ({
      id: 'editor',
      type: 'editor',
      options: {id: new Date().toISOString().slice(0, 10), type: 'gallery'},
    }))
    .serialize()

  const resolverContext = {structureBuilder: S, client} as any
  const context = {parent: list, index: 0}
  serializeStructure(list.child, context, [resolverContext, 'today', context]).subscribe(
    (child) => {
      expect(child).toHaveProperty('options.id', new Date().toISOString().slice(0, 10))
      done()
    }
  )
})

test('can resolve undefined child', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const list = S.list()
    .id('books')
    .items([{id: 'today', title: 'Today', type: 'listItem'}])
    .child(() => undefined)
    .serialize()

  const resolverContext = {structureBuilder: S, client} as any
  const context = {parent: list, index: 0}
  serializeStructure(list.child, context, [resolverContext, 'today', context]).subscribe(
    (child) => {
      expect(child).toBeUndefined()
      done()
    }
  )
})

test('can set menu items', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('yeah')
      .menuItems([{title: 'Print', action: noop}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items with builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('yeah')
      .menuItems([S.menuItem().title('Purge').action(noop)])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu item groups', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('yeah')
      .menuItems([{title: 'Print', action: noop, group: 'old-school'}])
      .menuItemGroups([{title: 'Old-school', id: 'old-school'}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items groups with builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.list()
      .id('yeah')
      .menuItems([S.menuItem().title('Print').action(noop).group('old-school')])
      .menuItemGroups([S.menuItemGroup().id('old-school').title('Old-school')])
      .serialize()
  ).toMatchSnapshot()
})

test('can set intent handler check', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const handler = () => false
  expect(S.list().id('yeah').canHandleIntent(handler).serialize()).toMatchObject({
    canHandleIntent: handler,
  })
})

test('can disable icons from being displayed', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const list = S.list().title('Blåmuggost').showIcons(false)

  expect(list.serialize()).toMatchObject({
    id: 'blamuggost',
    displayOptions: {showIcons: false},
  })

  expect(list.getShowIcons()).toBe(false)
})

test('builder is immutable', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.list()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.items([])).not.toBe(original)
  expect(original.menuItems([])).not.toBe(original)
  expect(original.menuItemGroups([])).not.toBe(original)
  expect(original.defaultLayout('card')).not.toBe(original)
  expect(original.child(() => undefined)).not.toBe(original)
  expect(original.canHandleIntent(() => false)).not.toBe(original)
})

test('getters work', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.list()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('foo').getTitle()).toEqual('foo')
  expect(original.items([]).getItems()).toEqual([])
  expect(original.menuItems([]).getMenuItems()).toEqual([])
  expect(original.menuItemGroups([]).getMenuItemGroups()).toEqual([])
  expect(original.defaultLayout('card').getDefaultLayout()).toEqual('card')
})
