import {SchemaType} from '@sanity/types'
import {createStructureBuilder} from '../src'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

test('builds list items with only ID and title', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.listItem({id: 'foo', title: 'Foo'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.listItem().serialize()).toThrowErrorMatchingSnapshot()
})

test('infers ID from title if not specified', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.listItem().title('Hei der').getId()).toEqual('heiDer')
  expect(S.listItem().id('zing').title('Hei der').getId()).toEqual('zing')
  expect(S.listItem().title('Hei der').id('blah').getId()).toEqual('blah')
})

test('throws if no title is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.listItem().id('foo').serialize()).toThrowErrorMatchingSnapshot()
})

test('builds list items with ID and title through setters', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.listItem({id: 'books', title: 'Books'}).id('authors').title('Authors').serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child (editor node)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.listItem({id: 'wow', title: 'The Winds of Winter'})
      .child({id: 'foo', type: 'editor', options: {id: 'wow', type: 'book'}})
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child resolver', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.listItem({id: 'wow', title: 'The Winds of Winter'})
      .child(() =>
        S.editor({id: 'editor', title: 'Editor', options: {id: 'docId', type: 'book'}}).serialize()
      )
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with child defined through builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.listItem({id: 'asoiaf', title: 'A Song of Ice and Fire'})
      .child(S.documentList().id('asoiaf-books').filter('author == "grrm"'))
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specified schema type', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.listItem({id: 'foo', title: 'Foo'})
      .schemaType({name: 'book', type: {name: 'object'}} as SchemaType)
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with display options (dont show icon)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.listItem({id: 'foo', title: 'Foo'}).showIcon(false).serialize()).toMatchSnapshot()
})

test('builds list items with display options (show icon)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.listItem({id: 'foo', title: 'Foo'}).showIcon(true).serialize()).toMatchSnapshot()
})

test('builder is immutable', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.listItem()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.child(() => undefined)).not.toBe(original)
  expect(original.schemaType('foo')).not.toBe(original)
  expect(original.showIcon(true)).not.toBe(original)
})

test('getters work', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.listItem()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
  expect(original.schemaType('baz').getSchemaType()).toEqual('baz')
  expect(original.showIcon(true).getShowIcon()).toEqual(true)
})
