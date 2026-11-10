import {describe, expect, it} from 'vitest'

import {buildFeedGroupIdsQuery, buildFeedPageQuery} from '../versionFeedQueries'

const GROUP_ID =
  'coalesce(_system.group._ref, select(_id in path("drafts.**") => string::split(_id, "drafts.")[1], _id in path("versions.**") => array::join(string::split(_id, ".")[2..100], "."), _id))'

describe('buildFeedGroupIdsQuery', () => {
  it('derives each group id from _system.group or the id, once, leaving system documents out', () => {
    expect(buildFeedGroupIdsQuery('_type == "author"')).toEqual({
      fetch: `array::unique(*[(_type == "author") && !(_id in path("_.**"))] | order(${GROUP_ID} asc){"g": ${GROUP_ID}}.g)`,
      listen: '*[(_type == "author") && !(_id in path("_.**"))]',
    })
  })

  it('keeps an OR filter inside its own parentheses', () => {
    expect(buildFeedGroupIdsQuery('_type == "a" || _type == "b"').listen).toBe(
      '*[(_type == "a" || _type == "b") && !(_id in path("_.**"))]',
    )
  })

  it('never uses an open slice, which GROQ does not parse', () => {
    expect(buildFeedGroupIdsQuery('_type == "author"').fetch).not.toMatch(/\.\.\.\]/)
  })
})

describe('buildFeedPageQuery', () => {
  it('reads every version of the page documents with one versionOf per document', () => {
    expect(buildFeedPageQuery(['jane', 'authors.joe'])).toEqual({
      fetch:
        '*[sanity::versionOf($g0) || sanity::versionOf($g1)]{_id, _type, _rev, _createdAt, _updatedAt, _system}',
      listen: '*[sanity::versionOf($g0) || sanity::versionOf($g1)]',
      params: {g0: 'jane', g1: 'authors.joe'},
    })
  })

  it('matches nothing for an empty page', () => {
    expect(buildFeedPageQuery([])).toMatchObject({listen: '*[false]', params: {}})
  })
})
