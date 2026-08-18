import {describe, expect, test} from 'vitest'

import {getRouteContext} from '../useMainDocument'

// Route matching is backed by URLPattern, which needs the polyfill in runtimes without a native
// implementation (Node < 24, jsdom). `useMainDocument` lazy loads it before matching; these tests
// call `getRouteContext` directly, so load it up front.
if (typeof URLPattern === 'undefined') {
  await import('urlpattern-polyfill')
}

describe('getRouteContext', () => {
  test('handles path parameters', () => {
    const path = '/type-slug/page-slug'
    const url = new URL(path, location.origin)
    expect(getRouteContext('/:type/:page', url)).toEqual({
      origin: location.origin,
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

  test('matches an absolute route only when the origins agree', () => {
    const url = new URL('/path', 'https://other.example')
    expect(getRouteContext('https://www.sanity.io/:slug', url)).toBeUndefined()
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
      origin: location.origin,
      path,
      params: {
        slug: 'café',
      },
    })
  })

  test('handles the custom regexp wildcard pattern reported in SAPP-4118', () => {
    // Compiled under path-to-regexp v6, threw under v8, works again under URLPattern
    const route = '/:prefix(.*)/course/:slug'

    expect(getRouteContext(route, new URL('/no/course/intro', location.origin))).toEqual({
      origin: location.origin,
      path: '/no/course/intro',
      params: {prefix: 'no', slug: 'intro'},
    })
    expect(getRouteContext(route, new URL('/course/intro', location.origin))).toBeUndefined()
  })

  test('tries each route in order and returns the first that matches', () => {
    // The workaround config studios migrated to for path-to-regexp v8 keeps working
    const routes = ['/course/:slug', '/*prefix/course/:slug']

    expect(getRouteContext(routes, new URL('/course/intro', location.origin))).toEqual({
      origin: location.origin,
      path: '/course/intro',
      params: {slug: 'intro'},
    })
    expect(getRouteContext(routes, new URL('/no/course/intro', location.origin))).toEqual({
      origin: location.origin,
      path: '/no/course/intro',
      params: {prefix: ['no'], slug: 'intro'},
    })
  })

  test('throws if an incorrect path is provided', () => {
    const path = '/a/b'
    const url = new URL(path, location.origin)
    // URLPattern rejects duplicate group names
    expect(() => getRouteContext('/:id/:id', url)).toThrow(
      '"/:id/:id" is not a valid route pattern',
    )
  })
})
