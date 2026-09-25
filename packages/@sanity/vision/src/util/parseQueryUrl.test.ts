import {describe, expect, it} from 'vitest'

import {parseQueryUrl} from './parseQueryUrl'

const datasets = ['production', 'staging']

describe('parseQueryUrl', () => {
  it('parses query URLs into tab fields', () => {
    const url =
      'https://abc123.api.sanity.io/v2025-02-19/data/query/staging?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&perspective=drafts'
    expect(parseQueryUrl(url, datasets)).toEqual({
      query: '*[_id == $id]',
      params: {id: 'a'},
      rawParams: '{\n  "id": "a"\n}',
      dataset: 'staging',
      apiVersion: 'v2025-02-19',
      perspective: 'drafts',
      hasUnsupportedPerspective: false,
      url,
    })
  })

  it('round-trips a $__proto__ parameter into the params text', () => {
    const parsed = parseQueryUrl(
      'https://abc123.api.sanity.io/v2025-02-19/data/query/production?query=*&%24__proto__=%7B%22a%22%3A1%7D',
      datasets,
    )

    expect(parsed?.rawParams).toBe('{\n  "__proto__": {\n    "a": 1\n  }\n}')
    // The text is what the params editor shows, and JSON.parse also reads the key as a parameter
    expect(Object.entries(JSON.parse(parsed?.rawParams ?? ''))).toEqual([['__proto__', {a: 1}]])
  })

  it('accepts listen URLs, custom domains and surrounding whitespace', () => {
    const parsed = parseQueryUrl(
      '  https://cdn.example.com/v2021-03-25/data/listen/production?query=*  ',
      datasets,
    )
    expect(parsed?.query).toBe('*')
    expect(parsed?.dataset).toBe('production')
    expect(parsed?.apiVersion).toBe('v2021-03-25')
    expect(parsed?.perspective).toBeUndefined()
  })

  it('drops unknown datasets and unsupported perspectives', () => {
    const parsed = parseQueryUrl(
      'https://abc123.api.sanity.io/vX/data/query/other?query=*&perspective=rXyz%2Cdrafts',
      datasets,
    )
    expect(parsed?.dataset).toBeUndefined()
    expect(parsed?.apiVersion).toBe('vX')
    expect(parsed?.perspective).toBeUndefined()
    expect(parsed?.hasUnsupportedPerspective).toBe(true)
  })

  it('returns null for anything that is not a query URL', () => {
    expect(parseQueryUrl('*[_type == "author"]', datasets)).toBeNull()
    expect(parseQueryUrl('https://www.sanity.io/docs', datasets)).toBeNull()
    expect(
      parseQueryUrl(
        'https://abc123.api.sanity.io/v2025-02-19/data/query/production?foo=1',
        datasets,
      ),
    ).toBeNull()
    expect(
      parseQueryUrl(
        'https://abc123.api.sanity.io/v2025-02-19/data/query/production?query=*&%24id=not-json',
        datasets,
      ),
    ).toBeNull()
  })
})
