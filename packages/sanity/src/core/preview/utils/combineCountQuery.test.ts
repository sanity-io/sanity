import {describe, expect, it} from 'vitest'

import {
  COMBINED_COUNT_QUERY_MEMBER_SIZE,
  combineCountQuery,
  type CountDescriptor,
  demuxCountResult,
} from './combineCountQuery'

describe('combineCountQuery', () => {
  it('namespaces each descriptor by index to avoid param collisions', () => {
    const {params} = combineCountQuery([{type: 'author'}, {type: 'book'}])

    expect(params).toEqual({c0_type: 'author', c1_type: 'book'})
  })

  it('carries the type name as a param, never as query text', () => {
    const {query} = combineCountQuery([{type: 'author'}])

    expect(query).toContain('_type == $c0_type')
    expect(query).not.toContain('author')
  })

  it('keys the projection by the descriptor index', () => {
    const {query} = combineCountQuery([{type: 'author'}, {type: 'book'}])

    expect(query).toBe('{"0": count(*[_type == $c0_type]),"1": count(*[_type == $c1_type])}')
  })
})

describe('COMBINED_COUNT_QUERY_MEMBER_SIZE', () => {
  it.each([1, 50, 300, 286])(
    'sums to an upper bound on the real generated query length for %i descriptors',
    (memberCount) => {
      const descriptors: CountDescriptor[] = Array.from({length: memberCount}, () => ({
        type: 'someType',
      }))

      const estimatedTotal = memberCount * COMBINED_COUNT_QUERY_MEMBER_SIZE

      expect(estimatedTotal).toBeGreaterThanOrEqual(combineCountQuery(descriptors).query.length)
    },
  )
})

describe('demuxCountResult', () => {
  it('reads counts aligned to descriptor order, defaulting missing entries to 0', () => {
    expect(demuxCountResult({'0': 5, '2': 3}, 3)).toEqual([5, 0, 3])
  })

  it('returns all zeroes for a null or non-object result', () => {
    expect(demuxCountResult(null, 2)).toEqual([0, 0])
  })
})
