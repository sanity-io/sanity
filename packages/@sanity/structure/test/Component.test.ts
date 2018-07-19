import {StructureBuilder as S} from '../src'

const noop = () => null
const component = () => null

test('builds component node through constructor', () => {
  expect(
    S.component({
      id: 'foo',
      title: 'some title',
      component
    }).serialize()
  ).toMatchSnapshot()
})

test('builds component node through alt. constructor', () => {
  expect(
    S.component(component)
      .id('foo')
      .serialize()
  ).toMatchSnapshot()
})

test('throws on missing id', () => {
  expect(() =>
    S.component()
      .title('title')
      .serialize()
  ).toThrowError(/`id` is required/)
})

test('throws on missing component', () => {
  expect(() =>
    S.component()
      .id('id')
      .title('title')
      .serialize()
  ).toThrowError(/`component` is required/)
})

test('can construct using builder', () => {
  expect(
    S.component()
      .id('yeah')
      .title('Yeah')
      .component(component)
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
