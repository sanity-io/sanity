import {describe, expect, it} from 'vitest'

import {extractAllReferencedIds} from './extractAllReferencedIds'

describe('extractAllReferencedIds', () => {
  it('extracts _id values from direct children of the root', () => {
    const result = {
      _id: 'book-1',
      title: 'My Book',
      author: {_id: 'author-1', _rev: 'abc', _type: 'author', name: 'John'},
      category: {_id: 'cat-1', _rev: 'def', _type: 'category', title: 'Fiction'},
    }
    const ids = extractAllReferencedIds(result)
    expect(ids).toEqual(new Set(['author-1', 'cat-1']))
  })

  it('extracts deeply nested _id values', () => {
    const result = {
      _id: 'book-1',
      author: {
        _id: 'author-1',
        _rev: 'abc',
        bestFriend: {
          _id: 'person-99',
          _rev: 'xyz',
          mentor: {_id: 'mentor-5', _rev: 'zzz'},
        },
      },
    }
    const ids = extractAllReferencedIds(result)
    expect(ids).toEqual(new Set(['author-1', 'person-99', 'mentor-5']))
  })

  it('returns empty set for null result', () => {
    expect(extractAllReferencedIds(null)).toEqual(new Set())
  })

  it('skips fields that are not objects with _id', () => {
    const result = {_id: 'book-1', title: 'My Book', author: null}
    expect(extractAllReferencedIds(result)).toEqual(new Set())
  })

  it('handles drafts prefix by normalizing to published id', () => {
    const result = {
      _id: 'book-1',
      author: {_id: 'drafts.author-1', _rev: 'abc', _type: 'author', name: 'John'},
    }
    const ids = extractAllReferencedIds(result)
    expect(ids).toEqual(new Set(['author-1']))
  })

  it('skips the root _id itself', () => {
    const result = {_id: 'root-doc', _rev: 'r1', title: 'Hello'}
    expect(extractAllReferencedIds(result)).toEqual(new Set())
  })

  it('ignores arrays', () => {
    const result = {
      _id: 'doc-1',
      tags: [{_id: 'tag-1'}, {_id: 'tag-2'}],
    }
    expect(extractAllReferencedIds(result)).toEqual(new Set())
  })

  it('handles empty nested objects without _id', () => {
    const result = {
      _id: 'doc-1',
      metadata: {createdAt: '2024-01-01'},
    }
    expect(extractAllReferencedIds(result)).toEqual(new Set())
  })
})
