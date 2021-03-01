import {StructureBuilder as S} from '../src'

const noop = () => null
const component = () => null
const options = {foo: 'bar'}
const childResolver = () => undefined

test('builds component node through constructor', () => {
  expect(
    S.component({
      id: 'foo',
      title: 'some title',
      child: childResolver,
      options,
      component,
    }).serialize()
  ).toMatchSnapshot()
})

test('builds component node through alt. constructor', () => {
  expect(S.component(component).id('foo').child(childResolver).serialize()).toMatchSnapshot()
})

test('throws on missing id', () => {
  expect(() => S.component().serialize()).toThrowError(/`id` is required/)
})

test('infers ID from title if not specified', () => {
  expect(S.component().title('Hei der').getId()).toEqual('heiDer')
  expect(S.component().id('zing').title('Hei der').getId()).toEqual('zing')
  expect(S.component().title('Hei der').id('blah').getId()).toEqual('blah')
})

test('throws on missing component', () => {
  expect(() => S.component().id('id').title('title').serialize()).toThrowError(
    /`component` is required/
  )
})

test('can construct using builder', () => {
  expect(
    S.component()
      .id('yeah')
      .title('Yeah')
      .component(component)
      .options(options)
      .child(childResolver)
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items', () => {
  expect(
    S.component()
      .id('yeah')
      .component(component)
      .menuItems([{title: 'Print', action: noop}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items with builder', () => {
  expect(
    S.component()
      .id('yeah')
      .component(component)
      .menuItems([S.menuItem().title('Purge').action(noop)])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu item groups', () => {
  expect(
    S.component()
      .id('yeah')
      .component(component)
      .menuItems([{title: 'Print', action: noop, group: 'old-school'}])
      .menuItemGroups([{title: 'Old-school', id: 'old-school'}])
      .serialize()
  ).toMatchSnapshot()
})

test('can set menu items groups with builder', () => {
  expect(
    S.component()
      .id('yeah')
      .component(component)
      .menuItems([S.menuItem().title('Print').action(noop).group('old-school')])
      .menuItemGroups([S.menuItemGroup().id('old-school').title('Old-school')])
      .serialize()
  ).toMatchSnapshot()
})

test('builder is immutable', () => {
  const original = S.component()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.component(component)).not.toBe(original)
  expect(original.options(options)).not.toBe(original)
  expect(original.child(childResolver)).not.toBe(original)
  expect(original.menuItems([])).not.toBe(original)
  expect(original.menuItemGroups([])).not.toBe(original)
})

test('getters work', () => {
  const original = S.component()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
  expect(original.component(component).getComponent()).toEqual(component)
  expect(original.options(options).getOptions()).toEqual(options)
  expect(original.menuItems([]).getMenuItems()).toEqual([])
  expect(original.menuItemGroups([]).getMenuItemGroups()).toEqual([])
  expect(original.child(childResolver).getChild()).toEqual(childResolver)
})
