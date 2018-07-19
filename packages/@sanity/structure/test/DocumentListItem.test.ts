import {StructureBuilder as S} from '../src'

test('builds list items with only ID and schema type', () => {
  expect(S.documentListItem({id: 'foo', schemaType: 'author'}).serialize()).toMatchSnapshot()
})

test('throws if no id is set', () => {
  expect(() =>
    S.documentListItem()
      .schemaType('author')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('throws if no schema type is set', () => {
  expect(() =>
    S.documentListItem()
      .id('foo')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('throws if setting unknown schema type', () => {
  expect(() =>
    S.documentListItem()
      .id('foo')
      .schemaType('ZING')
      .serialize()
  ).toThrowErrorMatchingSnapshot()
})

test('builds list items with ID and schema type through setters', () => {
  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'})
      .id('grrm')
      .schemaType('author')
      .serialize()
  ).toMatchSnapshot()
})

test('setting title has no effect', () => {
  expect(
    S.documentListItem({id: 'wow', schemaType: 'post', title: 'foo'})
      .id('grrm')
      .schemaType('author')
      .title('bar')
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child (editor node)', () => {
  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'})
      .child({id: 'foo', type: 'editor', options: {id: 'wow', type: 'post'}})
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with specific child resolver', () => {
  expect(
    S.documentListItem({id: 'wow', schemaType: 'post'})
      .child(() =>
        S.editor({
          id: 'editor',
          type: 'post',
          options: {id: 'docId', type: 'post'}
        }).serialize()
      )
      .serialize()
  ).toMatchSnapshot()
})

test('builds list items with child defined through builder', () => {
  expect(
    S.documentListItem({id: 'asoiaf', schemaType: 'post'})
      .child(
        S.documentList()
          .id('asoiaf-posts')
          .filter('author == "grrm"')
      )
      .serialize()
  ).toMatchSnapshot()
})
