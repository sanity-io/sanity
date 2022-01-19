import {createStructureBuilder} from '../src'
import {serializeStructure} from './util/serializeStructure'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

test.only('builds document type lists with only required properties', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList({
      id: 'custom-id',
      title: 'Custom author title',
      schemaType: 'author',
    }).serialize({
      path: [],
    })
  ).toMatchSnapshot()
})

test('builds document type lists with schema type as string', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author').serialize({
      path: [],
    })
  ).toMatchSnapshot()
})

test('builds document type lists with schema type name + schema', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author').serialize({
      path: [],
    })
  ).toMatchSnapshot()
})

test('builds document type lists with schema type instance', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList({
      schemaType: schema.get('author')!,
    }).serialize({
      path: [],
    })
  ).toMatchSnapshot()
})

test('throws if no filter is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() =>
    S.documentTypeList('author').id('foo').filter('').serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('defaults to modern api version ', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.documentTypeList('author').serialize()).toHaveProperty(
    'options.apiVersion',
    '2021-06-07'
  )
})

test('defaults to api version v1 if custom filter is specified', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author').filter('_type == $type && custom == "prop"').serialize()
  ).toHaveProperty('options.apiVersion', '1')
})

test('builds document type lists through setters', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author')
      .id('authors')
      .title('authors')
      .filter('_type == $type')
      .params({type: 'author'})
      .defaultLayout('card')
      .defaultOrdering([{field: 'title', direction: 'asc'}])
      .serialize()
  ).toMatchSnapshot()
})

test('builds document type lists through setters (alt order)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author')
      .defaultOrdering([{field: 'title', direction: 'desc'}])
      .id('authors')
      .title('authors')
      .filter('_type == $type')
      .params({type: 'author'})
      .serialize()
  ).toMatchSnapshot()
})

test('builds document type lists through setters (alt order #2)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentTypeList('author')
      .params({type: 'author'})
      .defaultOrdering([{field: 'title', direction: 'desc'}])
      .id('authors')
      .title('authors')
      .filter('_type == $type')
      .serialize()
  ).toMatchSnapshot()
})

test('default child resolver resolves to editor', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const list = S.documentTypeList('author').serialize()

  const resolverContext = {structureBuilder: S, client} as any
  const context = {parent: list, index: 1}

  serializeStructure(list.child, context, [resolverContext, 'asoiaf-wow', context]).subscribe(
    (child) => {
      expect(child).toMatchObject({
        id: 'documentEditor',
        type: 'document',
        options: {
          id: 'asoiaf-wow',
          type: 'author',
        },
        views: [
          {
            id: 'editor',
            title: 'Editor',
            type: 'form',
          },
        ],
      })
      done()
    }
  )
})

test('builder is immutable', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.documentTypeList('author')
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.filter('foo == "bar"')).not.toBe(original)
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
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.documentTypeList('author')
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
  expect(original.showIcons(false).getShowIcons()).toEqual(false)
  expect(original.canHandleIntent(canHandleIntent).getCanHandleIntent()).toEqual(canHandleIntent)
  expect(original.defaultOrdering([{field, direction}]).getDefaultOrdering()).toEqual([
    {field, direction},
  ])
})

test('can disable icons from being displayed', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const list = S.documentTypeList('author')
    .id('blamuggost')
    .title('Blåmuggost')
    .filter('_type == "bluecheese"')
    .showIcons(false)

  expect(list.serialize()).toMatchObject({
    id: 'blamuggost',
    displayOptions: {showIcons: false},
  })

  expect(list.getShowIcons()).toBe(false)
})
