import {StructureBuilder as S} from '../src'

test('builds list items with only ID and title', () => {
  expect(S.listItem({id: 'foo', title: 'Foo'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  expect(() =>
    S.listItem()
      .title('foo')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('throws if no title is set', () => {
  expect(() =>
    S.listItem()
      .id('foo')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds list items with ID and title through setters', () => {
  expect(
    S.listItem({id: 'books', title: 'Books'})
      .id('authors')
      .title('Authors')
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child (editor node)', () => {
  expect(
    S.listItem({id: 'wow', title: 'The Winds of Winter'})
      .child({id: 'foo', type: 'editor', options: {id: 'wow', type: 'book'}})
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child resolver', () => {
  expect(
    S.listItem({id: 'wow', title: 'The Winds of Winter'})
      .child(() =>
        S.editor({id: 'editor', title: 'Editor', options: {id: 'docId', type: 'book'}}).serialize()
      )
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with child defined through builder', () => {
  expect(
    S.listItem({id: 'asoiaf', title: 'A Song of Ice and Fire'})
      .child(
        S.documentList()
          .id('asoiaf-books')
          .filter('author == "grrm"')
      )
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specified schema type', () => {
  expect(
    S.listItem({id: 'foo', title: 'Foo'})
      .schemaType({name: 'book', type: {name: 'object'}})
      .serialize()
  ).toMatchSnapshot()
})

test('builder is immutable', () => {
  const original = S.listItem()
  expect(original.id('foo')).not.toEqual(original)
  expect(original.title('foo')).not.toEqual(original)
  expect(original.child(() => undefined)).not.toEqual(original)
  expect(original.schemaType('foo')).not.toEqual(original)
})

test('getters work', () => {
  const original = S.listItem()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
  expect(original.schemaType('baz').getSchemaType()).toEqual('baz')
})
