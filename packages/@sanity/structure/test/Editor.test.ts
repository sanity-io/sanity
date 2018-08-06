import {StructureBuilder as S} from '../src'
import {defaultSchema} from '../src/parts/Schema'

test('builds editor node through constructor', () => {
  expect(
    S.editor({
      id: 'foo',
      title: 'some title',
      options: {
        id: 'docId',
        type: 'book'
      }
    }).serialize()
  ).toMatchSnapshot()
})

test('throws on missing id', () => {
  expect(() =>
    S.editor()
      .title('title')
      .documentId('docId')
      .schemaType('book')
      .serialize()
  ).toThrowError(/`id` is required/)
})

test('throws on missing document ID', () => {
  expect(() =>
    S.editor()
      .id('id')
      .title('title')
      .schemaType('book')
      .serialize()
  ).toThrowError(/document id/)
})

test('throws on missing document type', () => {
  expect(() =>
    S.editor()
      .id('id')
      .title('title')
      .documentId('docId')
      .serialize()
  ).toThrowError(/document type/)
})

test('can construct with schema type instead of schema type name', () => {
  expect(
    S.editor()
      .schemaType(defaultSchema.get('post'))
      .id('yeah')
      .title('Yeah')
      .documentId('wow')
      .serialize()
  ).toMatchSnapshot()
})

test('can construct using builder', () => {
  expect(
    S.editor()
      .id('yeah')
      .title('Yeah')
      .documentId('wow')
      .schemaType('book')
      .serialize()
  ).toMatchSnapshot()
})

test('can construct using builder (alt)', () => {
  expect(
    S.editor()
      .schemaType('book')
      .id('yeah')
      .title('Yeah')
      .documentId('wow')
      .serialize()
  ).toMatchSnapshot()
})
