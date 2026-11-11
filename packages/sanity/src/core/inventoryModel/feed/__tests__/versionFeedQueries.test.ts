import {evaluate, parse} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {buildFeedGroupIdsQuery, buildFeedPageQuery} from '../versionFeedQueries'

const GROUP_ID =
  'coalesce(_system.group._ref, select(_id in path("drafts.**") => array::join(string::split(_id, ".")[1..100], "."), _id in path("versions.**") => array::join(string::split(_id, ".")[2..100], "."), _id))'

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

  it('keeps dots, and a drafts. inside the id, in the group id', async () => {
    const dataset = [
      {_id: 'jane', _type: 'author'},
      {_id: 'drafts.jane', _type: 'author'},
      {_id: 'authors.drafts.joe', _type: 'author'},
      {_id: 'drafts.authors.drafts.joe', _type: 'author'},
      {_id: 'versions.rSpring.authors.drafts.joe', _type: 'author'},
      {_id: 'versions.a1b2c3.ann', _type: 'author', _system: {group: {_ref: 'ann', _weak: true}}},
    ]
    const {fetch} = buildFeedGroupIdsQuery('_type == "author"')
    const result = await evaluate(parse(fetch), {dataset})

    expect(await result.get()).toEqual(['ann', 'authors.drafts.joe', 'jane'])
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
