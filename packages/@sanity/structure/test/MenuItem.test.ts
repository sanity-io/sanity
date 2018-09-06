import {StructureBuilder as S} from '../src'

test('builds menu items with only title and action', () => {
  expect(S.menuItem({title: 'Foo', action: 'foo'}).serialize()).toMatchSnapshot()
})

test('throws if no title is set', () => {
  expect(() =>
    S.menuItem()
      .action('foo')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('throws if neither action nor intent is set', () => {
  expect(() => S.menuItem({title: 'foo'}).serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if setting both action AND intent', () => {
  expect(() =>
    S.menuItem()
      .title('foo')
      .action('foo')
      .intent({type: 'create'})
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds menu items with setters', () => {
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
  const input = {id: 'foo', title: 'Foo'}
  expect(S.menuItemGroup(input).serialize()).toMatchObject(input)
})

test('builds menu item groups through builder', () => {
  expect(
    S.menuItemGroup()
      .title('Foo')
      .id('foo')
      .serialize()
  ).toMatchObject({id: 'foo', title: 'Foo'})
})

test('throws if building menu item group without id', () => {
  expect(() =>
    S.menuItemGroup()
      .title('Foo')
      .serialize()
  ).toThrowError(/`id` is required/)
})

test('throws if building menu item group without title', () => {
  expect(() =>
    S.menuItemGroup()
      .id('foo')
      .serialize()
  ).toThrowError(/`title` is required/)
})

test('builder is immutable', () => {
  const original = S.menuItem()
  expect(original.title('foo')).not.toEqual(original)
  expect(original.params({foo: 'bar'})).not.toEqual(original)
  expect(original.action('doSomething')).not.toEqual(original)
  expect(original.intent({type: 'create'})).not.toEqual(original)
  expect(original.group('create')).not.toEqual(original)
  expect(original.icon(() => null)).not.toEqual(original)
  expect(original.showAsAction(false)).not.toEqual(original)
})

test('getters work', () => {
  const original = S.menuItem()
  expect(original.title('foo').getTitle()).toEqual('foo')
  expect(original.params({foo: 'bar'}).getParams()).toEqual({foo: 'bar'})
  expect(original.action('doSomething').getAction()).toEqual('doSomething')
  expect(original.intent({type: 'create'}).getIntent()).toEqual({type: 'create'})
  expect(original.group('create').getGroup()).toEqual('create')
  expect(original.icon(() => 'hei').getIcon()()).toEqual('hei')
  expect(original.showAsAction(false).getShowAsAction()).toEqual(false)
})
