import {describe, expect, test} from 'vitest'

import {DOCUMENT_LIST_SHAPE, parseDocumentList, parseSourceMapDocuments} from './documentListResult'

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
