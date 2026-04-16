import {describe, expect, it} from 'vitest'

import {allRevKeys} from './allRevKeys'

describe('allRevKeys', () => {
  it('builds key from root _rev and all nested _rev values', () => {
    const result = {
      _id: 'book-1',
      _rev: 'root-rev',
      author: {_id: 'author-1', _rev: 'author-rev', name: 'John'},
      category: {_id: 'cat-1', _rev: 'cat-rev', title: 'Fiction'},
    }
    expect(allRevKeys(result)).toBe('root-rev:author-rev:cat-rev')
  })

  it('includes deeply nested _rev values', () => {
    const result = {
      _id: 'book-1',
      _rev: 'root-rev',
      author: {
        _id: 'author-1',
        _rev: 'author-rev',
        bestFriend: {_id: 'friend-1', _rev: 'friend-rev'},
      },
    }
    expect(allRevKeys(result)).toBe('root-rev:author-rev:friend-rev')
  })

  it('returns empty string for null result', () => {
    expect(allRevKeys(null)).toBe('')
  })

  it('handles missing referenced fields', () => {
    const result = {_id: 'book-1', _rev: 'root-rev', author: null}
    expect(allRevKeys(result)).toBe('root-rev')
  })

  it('detects change when only a referenced doc _rev changes', () => {
    const before = {
      _id: 'book-1',
      _rev: 'root-rev',
      author: {_id: 'author-1', _rev: 'author-rev-1', name: 'John'},
    }
    const after = {
      _id: 'book-1',
      _rev: 'root-rev',
      author: {_id: 'author-1', _rev: 'author-rev-2', name: 'Jane'},
    }
    expect(allRevKeys(before)).not.toBe(allRevKeys(after))
  })

  it('returns just root _rev when no nested objects exist', () => {
    const result = {_id: 'doc-1', _rev: 'only-rev', title: 'Hello'}
    expect(allRevKeys(result)).toBe('only-rev')
  })

  it('skips objects without _rev', () => {
    const result = {
      _id: 'doc-1',
      _rev: 'root-rev',
      metadata: {createdAt: '2024-01-01'},
      author: {_id: 'author-1', _rev: 'author-rev'},
    }
    expect(allRevKeys(result)).toBe('root-rev:author-rev')
  })

  it('returns empty string for object with no _rev at any level', () => {
    const result = {_id: 'doc-1', title: 'No revisions here'}
    expect(allRevKeys(result)).toBe('')
  })
})
