import {describe, expect, it} from 'vitest'

import {buildFeedGroupIdsQuery, buildFeedPageQuery} from '../versionFeedQueries'

describe('buildFeedGroupIdsQuery', () => {
  it('fetches each document of the scope once, by group id, and listens to the same scope', () => {
    expect(buildFeedGroupIdsQuery('sanity::partOfVariant($variantId)')).toEqual({
      fetch:
        'array::unique(*[(sanity::partOfVariant($variantId)) && defined(_system.group._ref)] | order(_system.group._ref asc)._system.group._ref)',
      listen: '*[(sanity::partOfVariant($variantId)) && defined(_system.group._ref)]',
    })
  })

  it('keeps an OR filter inside its own parentheses', () => {
    expect(buildFeedGroupIdsQuery('_type == "a" || _type == "b"').listen).toBe(
      '*[(_type == "a" || _type == "b") && defined(_system.group._ref)]',
    )
  })
})

describe('buildFeedPageQuery', () => {
  it('reads every version of the page documents, as stubs only', () => {
    expect(buildFeedPageQuery()).toEqual({
      fetch:
        '*[_system.group._ref in $groupIds]{_id, _type, _rev, _createdAt, _updatedAt, _system}',
      listen: '*[_system.group._ref in $groupIds]',
    })
  })
})
