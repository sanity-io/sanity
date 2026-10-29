import {describe, expect, test} from 'vitest'

import {parseRoutePattern} from '../parseRoutePattern'

describe('parseRoutePattern', () => {
  test('leaves patterns that already are URLPattern syntax alone', () => {
    expect(parseRoutePattern('/course/:slug')).toEqual({
      pathname: '/course/:slug',
      groups: [{name: 'slug', repeat: false, separator: '/', legacyWildcard: false}],
    })
  })

  test('keeps the custom regexp groups path-to-regexp v8 removed', () => {
    expect(parseRoutePattern('/:prefix(.*)/course/:slug')).toEqual({
      pathname: '/:prefix(.*)/course/:slug',
      groups: [
        {name: 'prefix', repeat: false, separator: '/', legacyWildcard: false},
        {name: 'slug', repeat: false, separator: '/', legacyWildcard: false},
      ],
    })
  })

  test('rewrites path-to-regexp v8 wildcards, which URLPattern would read as literal text', () => {
    expect(parseRoutePattern('/*prefix/course/:slug')).toEqual({
      pathname: '/:prefix(.*)/course/:slug',
      groups: [
        {name: 'prefix', repeat: true, separator: '/', legacyWildcard: true},
        {name: 'slug', repeat: false, separator: '/', legacyWildcard: false},
      ],
    })
  })

  test('leaves v8 wildcards alone when asked to', () => {
    expect(parseRoutePattern('/*prefix/course/:slug', {rewriteLegacyWildcards: false})).toEqual({
      pathname: '/*prefix/course/:slug',
      groups: [
        {name: '0', repeat: false, separator: '/', legacyWildcard: false},
        {name: 'slug', repeat: false, separator: '/', legacyWildcard: false},
      ],
    })
  })

  test('keys unnamed groups by index, in source order, like URLPattern does', () => {
    expect(parseRoutePattern('/*/(\\d+)/:x/(.*)').groups).toEqual([
      {name: '0', repeat: false, separator: '/', legacyWildcard: false},
      {name: '1', repeat: false, separator: '/', legacyWildcard: false},
      {name: 'x', repeat: false, separator: '/', legacyWildcard: false},
      {name: '2', repeat: false, separator: '/', legacyWildcard: false},
    ])
  })

  test('records the `*` and `+` modifiers that make a param repeat', () => {
    expect(parseRoutePattern('/blog/:slug*').groups).toEqual([
      {name: 'slug', repeat: true, separator: '/', legacyWildcard: false},
    ])
    expect(parseRoutePattern('/blog/:slug+').groups).toEqual([
      {name: 'slug', repeat: true, separator: '/', legacyWildcard: false},
    ])
    expect(parseRoutePattern('/blog/:slug?').groups).toEqual([
      {name: 'slug', repeat: false, separator: '/', legacyWildcard: false},
    ])
  })

  test('carries a modifier on a `{…}` group over to the params inside it', () => {
    expect(parseRoutePattern('{/:parts}*').groups).toEqual([
      {name: 'parts', repeat: true, separator: '/', legacyWildcard: false},
    ])
    expect(parseRoutePattern('/:attr1?{-:attr2}?').groups).toEqual([
      {name: 'attr1', repeat: false, separator: '/', legacyWildcard: false},
      {name: 'attr2', repeat: false, separator: '-', legacyWildcard: false},
    ])
  })

  test('records the prefix that a repeated group joins its matches with', () => {
    expect(parseRoutePattern('{-:attr}+').groups).toEqual([
      {name: 'attr', repeat: true, separator: '-', legacyWildcard: false},
    ])
    expect(parseRoutePattern('/files/:name.:ext').groups).toEqual([
      {name: 'name', repeat: false, separator: '/', legacyWildcard: false},
      {name: 'ext', repeat: false, separator: '.', legacyWildcard: false},
    ])
  })

  test('escapes what the RegExp v flag reserves inside custom regexp groups', () => {
    expect(parseRoutePattern('/:slug([a-z0-9-]+)').pathname).toBe('/:slug([a-z0-9\\-]+)')
    expect(parseRoutePattern('/([^/]+)').pathname).toBe('/([^\\/]+)')
  })

  test('treats escaped characters as literal text', () => {
    expect(parseRoutePattern('/\\:not-a-param').groups).toEqual([])
    expect(parseRoutePattern('/\\*').groups).toEqual([])
  })

  test('treats a colon that is not followed by a name as literal text', () => {
    expect(parseRoutePattern('/a:/b').groups).toEqual([])
  })
})
