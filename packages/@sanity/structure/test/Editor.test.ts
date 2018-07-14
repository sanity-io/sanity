import {StructureBuilder as S} from '../src'

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
    S.editor({
      title: 'some title',
      options: {
        id: 'docId',
        type: 'book'
      }
    }).serialize()
  ).toThrowError(/`id` is required/)
})

test('throws on missing document ID', () => {
  expect(() =>
    S.editor({
      id: 'foo',
      title: 'some title',
      options: {
        type: 'book'
      }
    }).serialize()
  ).toThrowError(/document id/)
})

test('throws on missing document type', () => {
  expect(() =>
    S.editor({
      id: 'foo',
      title: 'some title',
      options: {
        id: 'wow'
      }
    }).serialize()
  ).toThrowError(/document type/)
})

test('can construct using builder', () => {
  expect(
    S.editor()
      .id('yeah')
      .title('Yeah')
      .documentId('wow')
      .type('book')
      .serialize()
  ).toMatchSnapshot()
})

test('can construct using builder (alt)', () => {
  expect(
    S.editor()
      .type('book')
      .id('yeah')
      .title('Yeah')
      .documentId('wow')
      .serialize()
  ).toMatchSnapshot()
})
