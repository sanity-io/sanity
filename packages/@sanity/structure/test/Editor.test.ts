import {StructureBuilder as S} from '../src'
import {getDefaultSchema, SchemaType} from '../src/parts/Schema'

test('builds editor node through constructor', () => {
  expect(
    S.editor({
      id: 'foo',
      title: 'some title',
      options: {
        id: 'docId',
        type: 'book',
        templateParameters: {
          foo: 'bar'
        }
      }
    }).serialize()
  ).toMatchSnapshot()
})

test('throws on missing id', () => {
  expect(() =>
    S.editor()
      .schemaType('book')
      .serialize()
  ).toThrowError(/`id` is required/)
})

test('infers ID from title if not specified', () => {
  expect(
    S.editor()
      .title('Hei der')
      .getId()
  ).toEqual('heiDer')
  expect(
    S.editor()
      .id('zing')
      .title('Hei der')
      .getId()
  ).toEqual('zing')
  expect(
    S.editor()
      .title('Hei der')
      .id('blah')
      .getId()
  ).toEqual('blah')
})

test('reuses editor ID if document ID is not set', () => {
  expect(
    S.editor()
      .id('id')
      .title('title')
      .schemaType('book')
      .serialize()
  ).toMatchObject({
    id: 'id',
    options: {id: 'id'}
  })
})

test('can construct with schema type instead of schema type name', () => {
  expect(
    S.editor()
      .schemaType(getDefaultSchema().get('post') as SchemaType)
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

test('builder is immutable', () => {
  const original = S.editor()
  expect(original.id('foo')).not.toEqual(original)
  expect(original.title('foo')).not.toEqual(original)
  expect(original.documentId('moo')).not.toEqual(original)
  expect(original.schemaType('author')).not.toEqual(original)
})

test('getters work', () => {
  const original = S.editor()
  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.title('bar').getTitle()).toEqual('bar')
  expect(original.documentId('moo').getDocumentId()).toEqual('moo')
  expect(original.schemaType('author').getSchemaType()).toEqual('author')
})
