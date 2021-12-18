import {createStructureBuilder} from '../src'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

const defaultIcon = () => 'NOPE'

test('builds menu items with only title and action', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.menuItem({title: 'Foo', action: 'foo'}).serialize()).toMatchSnapshot()
})

test('throws if no title is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.menuItem().action('foo').serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if neither action nor intent is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.menuItem({title: 'foo'}).serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if setting both action AND intent', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() =>
    S.menuItem().title('foo').action('foo').intent({type: 'create'}).serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds menu items with setters', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.menuItem()
      .title('Print')
      .action('print')
      .group('old-school')
      .icon(() => null)
      .params({foo: 'bar'})
      .showAsAction(false)
      .serialize()
  ).toMatchSnapshot()
})

test('builds menu item groups through constructor', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const input = {id: 'foo', title: 'Foo'}
  expect(S.menuItemGroup(input).serialize()).toMatchObject(input)
})

test('builds menu item groups through builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.menuItemGroup().title('Foo').id('foo').serialize()).toMatchObject({
    id: 'foo',
    title: 'Foo',
  })
})

test('throws if building menu item group without id', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.menuItemGroup().title('Foo').serialize()).toThrowError(/`id` is required/)
})

test('throws if building menu item group without title', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.menuItemGroup().id('foo').serialize()).toThrowError(/`title` is required/)
})

test('builder is immutable', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.menuItem()
  expect(original.title('foo')).not.toBe(original)
  expect(original.params({foo: 'bar'})).not.toBe(original)
  expect(original.action('doSomething')).not.toBe(original)
  expect(original.intent({type: 'create'})).not.toBe(original)
  expect(original.group('create')).not.toBe(original)
  expect(original.icon(() => null)).not.toBe(original)
  expect(original.showAsAction(false)).not.toBe(original)
})

test('getters work', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.menuItem()
  expect(original.title('foo').getTitle()).toEqual('foo')
  expect(original.params({foo: 'bar'}).getParams()).toEqual({foo: 'bar'})
  expect(original.action('doSomething').getAction()).toEqual('doSomething')
  expect(original.intent({type: 'create'}).getIntent()).toEqual({type: 'create'})
  expect(original.group('create').getGroup()).toEqual('create')
  expect(((original.icon((() => 'hei') as any).getIcon as any)() || defaultIcon)()).toEqual('hei')
  expect(original.showAsAction(false).getShowAsAction()).toEqual(false)
})
