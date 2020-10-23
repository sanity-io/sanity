import {StructureBuilder as S} from '../src'
import {getDefaultSchema, SchemaType} from '../src/parts/Schema'

test('builds document node through constructor', () => {
  expect(
    S.document({
      id: 'foo',
      options: {
        id: 'docId',
        type: 'book',
        templateParameters: {
          foo: 'bar',
        },
      },
    }).serialize()
  ).toMatchSnapshot()
})

test('throws on missing id', () => {
  expect(() => S.document().schemaType('book').serialize()).toThrowError(/`id` is required/)
})

test('reuses pane ID if document ID is not set', () => {
  expect(S.document().id('id').schemaType('book').serialize()).toMatchObject({
    id: 'id',
    options: {id: 'id'},
  })
})

test('can construct with schema type instead of schema type name', () => {
  expect(
    S.document()
      .schemaType(getDefaultSchema().get('post') as SchemaType)
      .id('yeah')
      .documentId('wow')
      .serialize()
  ).toMatchSnapshot()
})

test('can construct using builder', () => {
  expect(
    S.document()
      .id('yeah')
      .documentId('wow')
      .schemaType('book')
      .initialValueTemplate('book-by-author', {authorId: 'grrm'})
      .child(() => S.documentTypeList('post'))
      .serialize()
  ).toMatchSnapshot()
})

test('can construct using builder (alt)', () => {
  expect(
    S.document().schemaType('book').id('yeah').documentId('wow').views([]).serialize()
  ).toMatchSnapshot()
})

test('builder is immutable', () => {
  const original = S.document()
  expect(original.id('foo')).not.toBe(original)
  expect(original.views([])).not.toBe(original)
  expect(original.documentId('moo')).not.toBe(original)
  expect(original.schemaType('author')).not.toBe(original)
  expect(original.initialValueTemplate('book-by-author')).not.toBe(original)
  expect(original.child(() => S.documentTypeList('post'))).not.toBe(original)
})

test('throws on duplicate view ids', () => {
  expect(() =>
    S.document()
      .id('got')
      .schemaType('book')
      .views([S.view.form(), S.view.form(), S.view.component(() => null).title('Not editor')])
      .serialize()
  ).toThrowError(/document node has views with duplicate IDs: editor/)
})

test('getters work', () => {
  const original = S.document()
  const child = () => S.documentTypeList('post')
  const views = [S.view.form()]

  expect(original.id('foo').getId()).toEqual('foo')
  expect(original.views(views).getViews()).toEqual(views)
  expect(original.child(child).getChild()).toEqual(child)
  expect(original.documentId('moo').getDocumentId()).toEqual('moo')
  expect(original.schemaType('author').getSchemaType()).toEqual('author')
  expect(original.initialValueTemplate('book-by-author').getInitalValueTemplate()).toEqual(
    'book-by-author'
  )
  expect(
    original
      .initialValueTemplate('book-by-author', {authorId: 'grrm'})
      .getInitialValueTemplateParameters()
  ).toEqual({authorId: 'grrm'})
})
