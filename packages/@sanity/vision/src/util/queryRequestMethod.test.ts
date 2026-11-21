import {describe, expect, it} from 'vitest'

import {encodeQueryString} from './encodeQueryString'
import {
  encodedQuerySize,
  encodedQuerySizeOfUrl,
  QUERY_URL_SIZE_LIMIT,
  queryRequestMethod,
  splitQuerySearchParams,
} from './queryRequestMethod'

/** A query whose `?query=…` string is exactly `size` long: `*` is not percent-encoded */
function queryOfEncodedSize(size: number): string {
  return '*'.repeat(size - '?query='.length)
}

describe('queryRequestMethod', () => {
  it('measures the query and params as the client encodes them into a URL', () => {
    // A space is one character (`+`), `[`, `=`, `$` and `"` three each (`%5B`, `%3D`, `%24`, `%22`)
    expect(encodedQuerySize('*[_id == $id]', {id: 'a'})).toBe(
      '?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22'.length,
    )
    expect(encodedQuerySize('*[_id == $id]', {id: 'a'})).toBe(
      encodeQueryString('*[_id == $id]', {id: 'a'}).length,
    )
    // Encoded length, not characters: `é` is `%C3%A9`
    expect(encodedQuerySize('é', {})).toBe('?query='.length + '%C3%A9'.length)
  })

  it('is GET below the client’s limit and POST from the limit on', () => {
    expect(QUERY_URL_SIZE_LIMIT).toBe(11264)
    const under = queryOfEncodedSize(QUERY_URL_SIZE_LIMIT - 1)
    const at = queryOfEncodedSize(QUERY_URL_SIZE_LIMIT)
    expect(encodedQuerySize(under, {})).toBe(11263)
    expect(encodedQuerySize(at, {})).toBe(11264)
    expect(queryRequestMethod(under, {})).toBe('GET')
    expect(queryRequestMethod(at, {})).toBe('POST')
  })

  it('counts the params, not the options', () => {
    // `&%24id=1` is eight characters, enough to push a query seven short of the limit over it
    const query = queryOfEncodedSize(QUERY_URL_SIZE_LIMIT - 7)
    expect(queryRequestMethod(query, {})).toBe('GET')
    expect(encodedQuerySize(query, {id: 1})).toBe(QUERY_URL_SIZE_LIMIT + 1)
    expect(queryRequestMethod(query, {id: 1})).toBe('POST')
    // Perspective, variant and the like stay in the URL of a POST too, so they are not measured
    expect(encodeQueryString(query, {}, {perspective: 'published'}).length).toBeGreaterThan(
      QUERY_URL_SIZE_LIMIT,
    )
    expect(queryRequestMethod(query, {})).toBe('GET')
  })

  it('measures the query and params a request URL carries the same way', () => {
    const query = '*[_id == $id] | order(_updatedAt desc)'
    const params = {id: 'a b', n: [1, 2]}
    const url = `https://abc.apicdn.sanity.io/v2025-02-19/data/query/production${encodeQueryString(
      query,
      params,
      {perspective: 'published', variant: 'french'},
    )}`
    expect(encodedQuerySizeOfUrl(url)).toBe(encodedQuerySize(query, params))
    expect(encodedQuerySizeOfUrl('not a url')).toBe(0)
  })

  it('splits the query and its params from the options, keeping each part’s order', () => {
    const searchParams = new URLSearchParams(
      '?perspective=published&query=*&%24id=%22a%22&variant=french&$n=1&tag=vision',
    )
    const {query, options} = splitQuerySearchParams(searchParams)
    expect([...query]).toEqual([
      ['query', '*'],
      ['$id', '"a"'],
      ['$n', '1'],
    ])
    expect([...options]).toEqual([
      ['perspective', 'published'],
      ['variant', 'french'],
      ['tag', 'vision'],
    ])
    expect(splitQuerySearchParams(new URLSearchParams()).query.size).toBe(0)
  })
})
