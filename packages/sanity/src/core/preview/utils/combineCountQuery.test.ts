import {describe, expect, it} from 'vitest'

import {combineCountQuery, demuxCountResult} from './combineCountQuery'

describe('combineCountQuery', () => {
  it('namespaces each descriptor by index to avoid param collisions', () => {
    const {params} = combineCountQuery([
      {filter: '_type == $type', params: {type: 'author'}},
      {filter: '_type == $type', params: {type: 'book'}},
    ])

    expect(params).toEqual({c0_type: 'author', c1_type: 'book'})
  })

  it('rewrites $type to $c0_type in the filter', () => {
    const {query} = combineCountQuery([{filter: '_type == $type', params: {type: 'author'}}])

    expect(query).toContain('_type == $c0_type')
    expect(query).not.toContain('$type')
  })

  it('keys the projection by the descriptor index', () => {
    const {query} = combineCountQuery([
      {filter: '_type == $type', params: {type: 'author'}},
      {filter: 'defined(title)', params: {}},
    ])

    expect(query).toBe('{"0": count(*[_type == $c0_type]),"1": count(*[defined(title)])}')
  })

  it('namespaces every token in a multi-token filter', () => {
    const {query, params} = combineCountQuery([
      {filter: '_type == $type && category == $category', params: {type: 'post', category: 'news'}},
    ])

    expect(query).toContain('_type == $c0_type && category == $c0_category')
    expect(params).toEqual({c0_type: 'post', c0_category: 'news'})
  })

  it('namespaces param keys without touching their values', () => {
    const {params} = combineCountQuery([
      {filter: '_type in $types', params: {types: ['a', 'b'], nested: {deep: true}}},
    ])

    expect(params).toEqual({c0_types: ['a', 'b'], c0_nested: {deep: true}})
  })
})

describe('demuxCountResult', () => {
  it('reads counts aligned to descriptor order, defaulting missing entries to 0', () => {
    expect(demuxCountResult({'0': 5, '2': 3}, 3)).toEqual([5, 0, 3])
  })

  it('returns all zeroes for a null or non-object result', () => {
    expect(demuxCountResult(null, 2)).toEqual([0, 0])
  })
})
