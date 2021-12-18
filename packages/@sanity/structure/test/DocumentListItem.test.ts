import {createStructureBuilder} from '../src'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

test('builds list items with only ID and schema type', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.documentListItem({id: 'foo', schemaType: 'author'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.documentListItem().schemaType('author').serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if no schema type is set', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() => S.documentListItem().id('foo').serialize()).toThrowErrorMatchingSnapshot()
})

test('throws if setting unknown schema type', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(() =>
    S.documentListItem().id('foo').schemaType('ZING').serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds list items with ID and schema type through setters', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'}).id('grrm').schemaType('author').serialize()
  ).toMatchSnapshot()
})

test('setting title has no effect', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentListItem({id: 'wow', schemaType: 'post', title: 'foo'})
      .id('grrm')
      .schemaType('author')
      .title('bar')
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child (editor node)', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'})
      .child({id: 'foo', type: 'editor', options: {id: 'wow', type: 'post'}})
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child resolver', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'})
      .child(() =>
        S.editor({
          id: 'editor',
          type: 'post',
          options: {id: 'docId', type: 'post'},
        }).serialize()
      )
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with child defined through builder', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(
    S.documentListItem({id: 'asoiaf', schemaType: 'post'})
      .child(S.documentList().id('asoiaf-posts').filter('author == "grrm"'))
      .serialize()
  ).toMatchSnapshot()
})

test('builder is immutable', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.documentListItem()
  expect(original.id('foo')).not.toBe(original)
  expect(original.title('foo')).not.toBe(original)
  expect(original.child(() => undefined)).not.toBe(original)
})

test('getters work', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const original = S.documentListItem()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
})
