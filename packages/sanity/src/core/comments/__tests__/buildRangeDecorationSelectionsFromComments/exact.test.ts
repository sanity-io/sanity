import {describe, expect, test} from 'vitest'

import {type CommentDocument, type CommentRangeEntry} from '../../types'
import {buildRangeDecorationSelectionsFromComments} from '../../utils'

const COMMENT_ID = 'a14fb200-a4c4-4c44-b2c1-c17aa6d79aa8'

function makeComment(path: CommentDocument['target']['path']): CommentDocument {
  return {
    _id: COMMENT_ID,
    _type: 'comment',
    _createdAt: '',
    _rev: '',
    authorId: '',
    message: null,
    threadId: '',
    status: 'open',
    reactions: null,
    target: {
      documentRevisionId: '',
      path,
      documentType: '',
      document: {
        _dataset: '',
        _projectId: '',
        _ref: '',
        _type: 'crossDatasetReference',
        _weak: false,
      },
    },
  }
}

function makeEntry(
  anchorBlockKey: string,
  anchorOffset: number,
  focusBlockKey: string,
  focusOffset: number,
): CommentRangeEntry {
  return {
    _key: COMMENT_ID,
    field: '',
    start: {path: `[_key=='${anchorBlockKey}']`, position: anchorOffset},
    end: {path: `[_key=='${focusBlockKey}']`, position: focusOffset},
    reference: {_type: 'collaboration.comment', _id: COMMENT_ID},
  }
}

describe('comments: buildRangeDecorationSelectionsFromComments', () => {
  test('valid range produces correct EditorSelection', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 6, 'b1', 11)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(1)
    expect(result.decorations[0].selection).toEqual({
      anchor: {offset: 6, path: [{_key: 'b1'}, 'children', {_key: 's1'}]},
      focus: {offset: 11, path: [{_key: 'b1'}, 'children', {_key: 's1'}]},
    })
    expect(result.detachedCommentIds).toEqual([])
  })

  test('range spanning multiple children (bold spans)', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_type: 'span', _key: 's1', marks: [], text: 'Hello th'},
          {_type: 'span', _key: 's2', marks: ['strong'], text: 'e'},
          {_type: 'span', _key: 's3', marks: [], text: 're world'},
        ],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 6, 'b1', 11)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(1)
    expect(result.decorations[0].selection).toEqual({
      anchor: {offset: 6, path: [{_key: 'b1'}, 'children', {_key: 's1'}]},
      focus: {offset: 2, path: [{_key: 'b1'}, 'children', {_key: 's3'}]},
    })
  })

  test('range with bold before the selection resolves to correct span', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_type: 'span', _key: 's1', marks: ['strong'], text: 'Hello'},
          {_type: 'span', _key: 's2', marks: [], text: ' there world'},
        ],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 6, 'b1', 11)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(1)
    expect(result.decorations[0].selection).toEqual({
      anchor: {offset: 1, path: [{_key: 'b1'}, 'children', {_key: 's2'}]},
      focus: {offset: 6, path: [{_key: 'b1'}, 'children', {_key: 's2'}]},
    })
  })

  test('range spanning bold inside and outside the selection', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_type: 'span', _key: 's1', marks: [], text: 'Hel'},
          {_type: 'span', _key: 's2', marks: ['strong'], text: 'lo th'},
          {_type: 'span', _key: 's3', marks: [], text: 'ere world'},
        ],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 6, 'b1', 11)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(1)
    expect(result.decorations[0].selection).toEqual({
      anchor: {offset: 3, path: [{_key: 'b1'}, 'children', {_key: 's2'}]},
      focus: {offset: 3, path: [{_key: 'b1'}, 'children', {_key: 's3'}]},
    })
  })

  test('zero-length range produces detached comment', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 6, 'b1', 6)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toEqual([COMMENT_ID])
  })

  test('missing block key produces detached comment', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('nonexistent', 0, 'nonexistent', 5)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toEqual([COMMENT_ID])
  })

  test('range past end of block produces detached comment', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello'}],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 2, 'b1', 100)]

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toEqual([COMMENT_ID])
  })

  test('comment without range is ignored', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ]

    const comments = [makeComment({field: ''})]
    const commentRangeEntries: CommentRangeEntry[] = []

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toEqual([])
  })

  test('comment with range ID but no matching entry is detached', () => {
    const value = [
      {
        _key: 'b1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 's1', marks: [], text: 'Hello there world'}],
      },
    ]

    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries: CommentRangeEntry[] = []

    const result = buildRangeDecorationSelectionsFromComments({
      value,
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toEqual([COMMENT_ID])
  })

  test('empty value returns empty result', () => {
    const comments = [makeComment({field: '', range: COMMENT_ID})]
    const commentRangeEntries = [makeEntry('b1', 0, 'b1', 5)]

    const result = buildRangeDecorationSelectionsFromComments({
      value: [],
      comments,
      commentRangeEntries,
    })

    expect(result.decorations).toHaveLength(0)
    expect(result.detachedCommentIds).toHaveLength(0)
  })
})
