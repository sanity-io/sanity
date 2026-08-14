import {describe, expect, test} from 'vitest'

import {createRouteMatcher} from '../matchRoute'

/**
 * Load the polyfill the way `useMainDocument` does when the runtime has no native URLPattern
 * (Node < 24, jsdom). Which implementation ends up exercised depends on the runtime, mirroring
 * what happens in browsers — the suite passes on both.
 */
const urlPatternImplementation = typeof URLPattern === 'undefined' ? 'polyfill' : 'native'
if (typeof URLPattern === 'undefined') {
  await import('urlpattern-polyfill')
}

describe('the pattern reported in SAPP-4118', () => {
  const matcher = createRouteMatcher('/:prefix(.*)/course/:slug')

  test('matches a single prefix segment', () => {
    expect(matcher('/no/course/intro')).toEqual({
      path: '/no/course/intro',
      params: {prefix: 'no', slug: 'intro'},
    })
  })

  test('matches a prefix spanning several segments', () => {
    expect(matcher('/en/gb/programmes/course/intro')).toEqual({
      path: '/en/gb/programmes/course/intro',
      params: {prefix: 'en/gb/programmes', slug: 'intro'},
    })
  })

  test('does not match without a prefix, which is why the workaround needed two patterns', () => {
    expect(matcher('/course/intro')).toBeUndefined()
  })

  test('accepts the array of patterns studios migrated to for path-to-regexp v8', () => {
    const withoutPrefix = createRouteMatcher('/course/:slug')
    const withPrefix = createRouteMatcher('/*prefix/course/:slug')

    expect(withoutPrefix('/course/intro')).toEqual({
      path: '/course/intro',
      params: {slug: 'intro'},
    })
    expect(withPrefix('/no/course/intro')).toEqual({
      path: '/no/course/intro',
      params: {prefix: ['no'], slug: 'intro'},
    })
  })
})

describe('path-to-regexp defaults the matcher reproduces', () => {
  test('matches case-insensitively (`sensitive: false`)', () => {
    const matcher = createRouteMatcher('/About/:slug')
    expect(matcher('/about/Intro')).toEqual({path: '/about/Intro', params: {slug: 'Intro'}})
    expect(createRouteMatcher('/about', {ignoreCase: false})('/About')).toBeUndefined()
  })

  test('accepts an optional trailing slash (`strict: false`)', () => {
    const matcher = createRouteMatcher('/course/:slug')
    expect(matcher('/course/intro/')).toEqual({path: '/course/intro/', params: {slug: 'intro'}})
    expect(matcher('/course/intro//')).toBeUndefined()
    expect(
      createRouteMatcher('/course/:slug', {trailingSlash: false})('/course/intro/'),
    ).toBeUndefined()
  })

  test('decodes params (`decode: decodeURIComponent`)', () => {
    const matcher = createRouteMatcher('/search/:query')
    expect(matcher('/search/hello%20world')).toEqual({
      path: '/search/hello%20world',
      params: {query: 'hello world'},
    })
  })

  test('omits an optional param that did not participate in the match', () => {
    const matcher = createRouteMatcher('/:locale?/product/:slug')
    expect(matcher('/product/shoe')).toEqual({path: '/product/shoe', params: {slug: 'shoe'}})
    expect(matcher('/no/product/shoe')).toEqual({
      path: '/no/product/shoe',
      params: {locale: 'no', slug: 'shoe'},
    })
  })

  test('returns repeated params as an array of segments', () => {
    expect(createRouteMatcher('/blog/:parts+')('/blog/a/b/c')).toEqual({
      path: '/blog/a/b/c',
      params: {parts: ['a', 'b', 'c']},
    })
    expect(createRouteMatcher('/blog/:parts*')('/blog')).toEqual({path: '/blog', params: {}})
    expect(createRouteMatcher('{-:attr}+')('-a-b')).toEqual({
      path: '-a-b',
      params: {attr: ['a', 'b']},
    })
  })

  test('keys unnamed groups by index', () => {
    expect(createRouteMatcher('/(\\d+)/:name/(.*)')('/1/x/y/z')).toEqual({
      path: '/1/x/y/z',
      params: {0: '1', name: 'x', 1: 'y/z'},
    })
  })
})

describe('params are built in pattern order', () => {
  // Native URLPattern and urlpattern-polyfill do not agree on the key order of `exec()` groups, and
  // Presentation forwards these params straight into a GROQ query.
  test('regardless of the order the URLPattern implementation reports groups in', () => {
    const match = createRouteMatcher('/:a?/:b?')('/x/y')
    expect(Object.keys(match!.params)).toEqual(['a', 'b'])
  })
})

describe('invalid patterns', () => {
  test('a pattern URLPattern cannot parse throws', () => {
    expect(() => createRouteMatcher('/:id/:id')).toThrow()
  })

  test('a custom regexp with a capturing group throws, as it did in path-to-regexp v6', () => {
    expect(() => createRouteMatcher('/:id((\\d+))')).toThrow()
  })
})

describe('the footgun a naive swap to URLPattern would introduce', () => {
  // URLPattern reads `*name` as a wildcard followed by the literal text `name`, so a v8-era pattern
  // silently matches the wrong paths rather than failing.
  const naive = createRouteMatcher('/*prefix/course/:slug', {rewriteLegacyWildcards: false})

  test('the intended path stops matching', () => {
    expect(naive('/no/course/intro')).toBeUndefined()
  })

  test('an unrelated path starts matching', () => {
    expect(naive('/marketingprefix/course/intro')).toEqual({
      path: '/marketingprefix/course/intro',
      params: {0: 'marketing', slug: 'intro'},
    })
  })

  test('rewriting the wildcard fixes both', () => {
    const matcher = createRouteMatcher('/*prefix/course/:slug')
    expect(matcher('/no/course/intro')).toEqual({
      path: '/no/course/intro',
      params: {prefix: ['no'], slug: 'intro'},
    })
    expect(matcher('/marketingprefix/course/intro')).toEqual({
      path: '/marketingprefix/course/intro',
      params: {prefix: ['marketingprefix'], slug: 'intro'},
    })
  })
})

describe('malformed percent-encoding', () => {
  // path-to-regexp v6 let `decodeURIComponent` throw, which `getRouteContext` then reported as an
  // invalid route pattern. Keeping the raw value is more useful than blaming the pattern.
  test('falls back to the raw param value', () => {
    expect(createRouteMatcher('/search/:query')('/search/100%')).toEqual({
      path: '/search/100%',
      params: {query: '100%'},
    })
  })
})

describe('percent-encoded literals: URLPattern is more correct than path-to-regexp', () => {
  // `getRouteContext` matches against `url.pathname`, which is always percent-encoded, so a route
  // pattern containing non-ASCII text could never match under path-to-regexp.
  const pattern = '/kurs/programmerings-oversikt-på-nett'
  const pathname = new URL(`https://example.com${pattern}`).pathname

  test('URLPattern canonicalizes the pattern and matches the real pathname', () => {
    expect(pathname).toBe('/kurs/programmerings-oversikt-p%C3%A5-nett')
    expect(createRouteMatcher(pattern)(pathname)).toEqual({path: pathname, params: {}})
  })

  test('URLPattern canonicalizes the input too, so it matches either spelling', () => {
    expect(createRouteMatcher(pattern)(pattern)).toEqual({path: pattern, params: {}})
  })
})

describe('`{…}` groups mean different things in v6 and v8; URLPattern agrees with v6', () => {
  // path-to-regexp v8 made a group without a modifier optional. In v6 and URLPattern the group is
  // required — a studio that adopted `{…}`-as-optional while on v8 needs to write `{…}?`.
  const pattern = '/books{/:id}'

  test('the group is required', () => {
    expect(createRouteMatcher(pattern)('/books')).toBeUndefined()
    expect(createRouteMatcher(pattern)('/books/1')).toEqual({
      path: '/books/1',
      params: {id: '1'},
    })
  })

  test('`{…}?` is how you make it optional', () => {
    expect(createRouteMatcher('/books{/:id}?')('/books')).toEqual({path: '/books', params: {}})
    expect(createRouteMatcher('/books{/:id}?')('/books/1')).toEqual({
      path: '/books/1',
      params: {id: '1'},
    })
  })
})

describe('urlpattern-polyfill mishandles pathnames that begin with a double slash', () => {
  // `new URL('https://example.com//a').pathname` is `//a`, which the polyfill canonicalizes as if
  // it were protocol-relative. Native URLPattern and path-to-regexp agree with each other here.
  // Pinned so the divergence is documented rather than discovered.
  const pathname = new URL('https://example.com//course/intro').pathname

  test('the pathname really is double-slashed', () => {
    expect(pathname).toBe('//course/intro')
  })

  test(`the current implementation is ${urlPatternImplementation}`, () => {
    const matcher = createRouteMatcher('/(.*)')
    if (urlPatternImplementation === 'polyfill') {
      // Known polyfill bug: `//course/intro` is read as authority `course` plus pathname `/intro`,
      // so the match succeeds against the wrong text instead of failing.
      expect(matcher(pathname)).toEqual({path: pathname, params: {0: 'intro'}})
    } else {
      expect(matcher(pathname)).toEqual({path: pathname, params: {0: '/course/intro'}})
    }
  })
})
