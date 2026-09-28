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
      isKnownDataset: true,
      apiVersion: 'v2025-02-19',
      urlPerspective: 'drafts',
      perspective: 'drafts',
      hasUnsupportedPerspective: false,
      variant: undefined,
      includeSourceMap: false,
      url,
    })
  })

  it('keeps the variant and the content source map flag the request was sent with', () => {
    const parsed = parseQueryUrl(
      'https://abc123.api.sanity.io/vX/data/query/production?query=*&variant=french&resultSourceMap=true',
      datasets,
    )
    expect(parsed?.variant).toBe('french')
    expect(parsed?.includeSourceMap).toBe(true)
    expect(parsed?.urlPerspective).toBeUndefined()

    // The client's other spelling of a source map request (its stega encoding, Presentation's loaders)
    const sourceMapFor = (mode: string) =>
      parseQueryUrl(
        `https://abc123.api.sanity.io/vX/data/query/production?query=*&resultSourceMap=${mode}`,
        datasets,
      )?.includeSourceMap
    expect(sourceMapFor('withKeyArraySelector')).toBe(true)
    // Not any value: the client leaves the option out rather than writing `false`
    expect(sourceMapFor('false')).toBe(false)
    expect(sourceMapFor('yes')).toBe(false)
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
    expect(parsed?.isKnownDataset).toBe(true)
    expect(parsed?.apiVersion).toBe('v2021-03-25')
    expect(parsed?.urlPerspective).toBeUndefined()
    expect(parsed?.perspective).toBeUndefined()
  })

  it('reports an unknown dataset and keeps an unsupported perspective as the URL states it', () => {
    const parsed = parseQueryUrl(
      'https://abc123.api.sanity.io/vX/data/query/other?query=*&perspective=rXyz%2Cdrafts',
      datasets,
    )
    // The dataset stays known by name, so the caller can say which one it could not use
    expect(parsed?.dataset).toBe('other')
    expect(parsed?.isKnownDataset).toBe(false)
    expect(parsed?.apiVersion).toBe('vX')
    // A release stack cannot become a tab option, but it still identifies the request
    expect(parsed?.urlPerspective).toBe('rXyz,drafts')
    expect(parsed?.perspective).toBeUndefined()
    expect(parsed?.hasUnsupportedPerspective).toBe(true)
  })

  it('takes the whole text to be the URL, not a fragment of it', () => {
    const url = 'https://abc123.api.sanity.io/v2025-02-19/data/query/production?query=*'
    expect(parseQueryUrl(url, datasets)?.query).toBe('*')
    // A query URL quoted inside other text is not a paste of that URL
    expect(parseQueryUrl(`see ${url}`, datasets)).toBeNull()
    expect(parseQueryUrl(`curl '${url}'`, datasets)).toBeNull()
    expect(
      parseQueryUrl('notes /v2025-02-19/data/query/production?query=* trailing', datasets),
    ).toBeNull()
    // Nor is a path without its origin, or a URL of another scheme
    expect(parseQueryUrl('/v2025-02-19/data/query/production?query=*', datasets)).toBeNull()
    expect(
      parseQueryUrl(
        'ftp://abc123.api.sanity.io/v2025-02-19/data/query/production?query=*',
        datasets,
      ),
    ).toBeNull()
    expect(
      parseQueryUrl(
        'https://abc123.api.sanity.io/v2025-02-19/data/query/production/extra?query=*',
        datasets,
      ),
    ).toBeNull()
    // `query` and `listen` are whole path segments, not the tail of another one
    expect(
      parseQueryUrl(
        'https://abc123.api.sanity.io/v2025-02-19/data/notquery/production?query=*',
        datasets,
      ),
    ).toBeNull()
    expect(
      parseQueryUrl('https://abc123.api.sanity.io/vX/query/production?query=*', datasets)?.query,
    ).toBe('*')
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
