import {describe, expect, test} from 'vitest'

import {
  canImproveDocumentList,
  describeDocumentListResult,
  DOCUMENT_LIST_SHAPE,
  getMissingRowFields,
  getRowTypes,
  parseDocumentList,
  parseSourceMapDocuments,
} from './documentListResult'

describe('parseDocumentList', () => {
  test('reads a projection of documents, in the result order', () => {
    expect(
      parseDocumentList([
        {_id: 'a', _type: 'author', title: 'Ada', subtitle: 'Writer', media: {asset: {_ref: 'x'}}},
        {_id: 'b', title: '  Bea  '},
        {_id: 'c', _type: '  ', title: '', subtitle: 3, media: null},
      ]),
    ).toEqual({
      ok: true,
      documents: [
        {_id: 'a', _type: 'author', title: 'Ada', subtitle: 'Writer', media: {asset: {_ref: 'x'}}},
        {_id: 'b', title: 'Bea'},
        {_id: 'c'},
      ],
    })
  })

  test('treats an empty array as an empty list', () => {
    expect(parseDocumentList([])).toEqual({ok: true, documents: []})
  })

  test('rejects a result that is not an array', () => {
    expect(parseDocumentList({_id: 'a'})).toEqual({ok: false, problem: {kind: 'not-array'}})
    expect(parseDocumentList('a')).toEqual({ok: false, problem: {kind: 'not-array'}})
    expect(parseDocumentList(null)).toEqual({ok: false, problem: {kind: 'not-array'}})
  })

  test('rejects a list with items that have no id, and counts them', () => {
    expect(
      parseDocumentList([
        {_id: 'a'},
        {},
        {_id: '  '},
        {_id: 7},
        null,
        'b',
        {_id: 'c', _type: 'book'},
      ]),
    ).toEqual({ok: false, problem: {kind: 'missing-id', count: 5, total: 7}})
  })

  test('names the shape the guidance shows', () => {
    expect(DOCUMENT_LIST_SHAPE).toBe('*[]{_id, _type, title?, subtitle?, media?}')
  })
})

describe('parseSourceMapDocuments', () => {
  test('lists the documents of a source map, keeping the project and dataset of remote ones', () => {
    expect(
      parseSourceMapDocuments({
        documents: [
          {_id: 'drafts.a', _type: 'author'},
          {_id: 'b', _type: 'book', _projectId: 'other-project', _dataset: 'other-dataset'},
          {_id: 'c', _type: 'book', _dataset: 'other-dataset'},
        ],
        paths: [],
        mappings: {},
      }),
    ).toEqual({
      ok: true,
      documents: [
        {_id: 'drafts.a', _type: 'author'},
        {
          _id: 'b',
          _type: 'book',
          _projectId: 'other-project',
          _dataset: 'other-dataset',
          subtitle: 'other-project · other-dataset',
        },
        {_id: 'c', _type: 'book', _dataset: 'other-dataset', subtitle: 'other-dataset'},
      ],
    })
  })

  test('skips entries without an id, and reads a source map without documents as empty', () => {
    expect(parseSourceMapDocuments({documents: [{_type: 'author'}, null, {_id: 'a'}]})).toEqual({
      ok: true,
      documents: [{_id: 'a'}],
    })
    expect(parseSourceMapDocuments({paths: []})).toEqual({ok: true, documents: []})
    expect(parseSourceMapDocuments(undefined)).toEqual({ok: true, documents: []})
  })
})

describe('canImproveDocumentList', () => {
  test('offers to change a result that is not a document list', () => {
    expect(canImproveDocumentList(parseDocumentList(42))).toBe(true)
    expect(canImproveDocumentList(parseDocumentList([{title: 'No id'}]))).toBe(true)
  })

  test('offers to change rows without a type, a title, or both a subtitle and an image', () => {
    expect(canImproveDocumentList(parseDocumentList([{_id: 'a', _type: 'book'}]))).toBe(true)
    expect(canImproveDocumentList(parseDocumentList([{_id: 'a', title: 'A', subtitle: 'B'}]))).toBe(
      true,
    )
    expect(canImproveDocumentList(parseDocumentList([{_id: 'a', _type: 'book', title: 'A'}]))).toBe(
      true,
    )
  })

  test('leaves rows the view can show alone, with or without an image', () => {
    expect(
      canImproveDocumentList(
        parseDocumentList([{_id: 'a', _type: 'book', title: 'A', subtitle: 'B'}]),
      ),
    ).toBe(false)
    expect(
      canImproveDocumentList(
        parseDocumentList([
          {_id: 'a', _type: 'book', title: 'A', media: {asset: {_ref: 'image-a'}}},
          {_id: 'b', _type: 'book'},
        ]),
      ),
    ).toBe(false)
  })

  test('leaves rows alone once they have what their types can give', () => {
    const titled = parseDocumentList([{_id: 'a', _type: 'setting', title: 'A'}])
    expect(canImproveDocumentList(titled, {title: true, subtitle: false, media: false})).toBe(false)
    expect(canImproveDocumentList(titled, {title: true, subtitle: true, media: false})).toBe(true)
    expect(
      canImproveDocumentList(parseDocumentList([{_id: 'a', _type: 'setting'}]), {
        title: false,
        subtitle: false,
        media: false,
      }),
    ).toBe(false)
  })

  test('still asks for a type, which every row can have', () => {
    expect(
      canImproveDocumentList(parseDocumentList([{_id: 'a', title: 'A'}]), {
        title: true,
        subtitle: false,
        media: false,
      }),
    ).toBe(true)
  })

  test('leaves an empty list alone', () => {
    expect(canImproveDocumentList(parseDocumentList([]))).toBe(false)
  })
})

describe('getMissingRowFields', () => {
  test('names the attributes no row has, in the order the view reads them', () => {
    const parsed = parseDocumentList([
      {_id: 'a', title: 'A'},
      {_id: 'b', media: 'x'},
    ])
    expect(parsed.ok && getMissingRowFields(parsed.documents)).toEqual(['_type', 'subtitle'])
  })
})

describe('getRowTypes', () => {
  test('lists the types the rows name once each', () => {
    expect(
      getRowTypes(
        parseDocumentList([
          {_id: 'a', _type: 'book'},
          {_id: 'b', _type: 'author'},
          {_id: 'c', _type: 'book'},
          {_id: 'd'},
        ]),
      ),
    ).toEqual(['book', 'author'])
    expect(getRowTypes(parseDocumentList(1))).toEqual([])
  })
})

describe('describeDocumentListResult', () => {
  test('describes a value that is not an array', () => {
    expect(describeDocumentListResult(42, parseDocumentList(42))).toBe('A number, not an array.')
    const single = {_id: 'a', _type: 'book', title: 'A'}
    expect(describeDocumentListResult(single, parseDocumentList(single))).toBe(
      'An object, not an array. It has _id, _type, title.',
    )
  })

  test('counts the items without an _id', () => {
    const result = [{name: 'A'}, {_id: 'b', name: 'B'}]
    expect(describeDocumentListResult(result, parseDocumentList(result))).toBe(
      'An array of 2 items, of which 1 have no _id. The first item has name.',
    )
  })

  test('names the row attributes the documents lack', () => {
    const result = [{_id: 'a', name: 'A', year: 1999}]
    expect(describeDocumentListResult(result, parseDocumentList(result))).toBe(
      'An array of 1 documents, none of which has _type, title, subtitle, media. The first item has _id, name, year.',
    )
  })
})
