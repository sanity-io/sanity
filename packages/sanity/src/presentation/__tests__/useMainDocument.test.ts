import {describe, expect, test} from 'vitest'

import {getRouteContext} from '../useMainDocument'

describe('getRouteContext', () => {
  test('handles path parameters', () => {
    const path = '/type-slug/page-slug'
    const url = new URL(path, location.origin)
    expect(getRouteContext('/:type/:page', url)).toEqual({
      origin: undefined,
      path,
      params: {
        type: 'type-slug',
        page: 'page-slug',
      },
    })
  })

  test('returns undefined if no match is found', () => {
    const path = '/bar/slug'
    const url = new URL(path, location.origin)
    expect(getRouteContext('/foo/:page', url)).toBeUndefined()
  })

  test('handles absolute URLs', () => {
    const path = '/path'
    const url = new URL(path, 'https://www.sanity.io')
    expect(getRouteContext('https://www.sanity.io/:slug', url)).toEqual({
      origin: 'https://www.sanity.io',
      path,
      params: {
        slug: 'path',
      },
    })
  })

  test('handles arrays', () => {
    const origin = 'https://www.sanity.co.uk'
    const path = '/page'
    const url = new URL(path, origin)
    expect(
      getRouteContext(['https://www.sanity.io/:slug', 'https://www.sanity.co.uk/:slug'], url),
    ).toEqual({
      origin,
      path,
      params: {
        slug: 'page',
      },
    })
  })

  test('decodes parameter URI components', () => {
    const path = '/caf%C3%A9'
    const url = new URL(path, location.origin)
    expect(getRouteContext('/:slug', url)).toEqual({
      origin: undefined,
      path,
      params: {
        slug: 'café',
      },
    })
  })

  test('throws if an incorrect path is provided', () => {
    const path = '/foo'
    const url = new URL(path, location.origin)
    expect(() => getRouteContext('/*', url)).toThrowError('"/*" is not a valid route pattern')
  })
})
