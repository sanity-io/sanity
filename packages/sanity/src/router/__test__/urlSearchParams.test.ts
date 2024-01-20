import {describe, expect, test} from '@jest/globals'

import {route} from '../route'

describe('decode w/UrlSearchParams', () => {
  const router = route.create('/tools/:tool', route.create('/edit/:documentId'))
  test('UrlSearchParams params with a simple route', () => {
    expect(router.decode('/tools/structure?a=b')).toEqual({
      tool: 'structure',
      _searchParams: [['a', 'b']],
    })
  })
  test('UrlSearchParams params with a nested route', () => {
    expect(router.decode('/tools/structure?view=zen')).toEqual({
      tool: 'structure',
      _searchParams: [['view', 'zen']],
    })
  })
})

describe('encode w/UrlSearchParams', () => {
  const router = route.create('/tools/:tool', route.create('/edit/:documentId'))
  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        tool: 'structure',
        _searchParams: [['a', 'b']],
      }),
    ).toEqual('/tools/structure?a=b')
  })
  test('UrlSearchParams params with a nested route', () => {
    expect(
      router.encode({
        tool: 'structure',
        _searchParams: [['view', 'zen']],
      }),
    ).toEqual('/tools/structure?view=zen')
  })
  test('Slashes in values are not encoded', () => {
    expect(
      router.encode({
        tool: 'structure',
        _searchParams: [['page', '/main']],
      }),
    ).toEqual('/tools/structure?page=/main')
  })
  test('Undefined in values are omitted', () => {
    expect(
      router.encode({
        tool: 'structure',
        _searchParams: [
          ['include', 'yes'],
          // @ts-expect-error - typescript should yell
          ['invalid', undefined],
          // @ts-expect-error - typescript should yell
          ['also', undefined],
        ],
      }),
    ).toEqual('/tools/structure?include=yes')
  })
})

describe('scoped url params', () => {
  const router = route.scope('pluginA', '/pluginA/:id', [
    route.scope('pluginAB', '/pluginAB/:qux', [route.scope('pluginABC', '/pluginABC/space/:arg')]),
  ])

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        pluginA: {
          id: 'foo',
          pluginAB: {
            qux: 'something',
            pluginABC: {
              arg: 'hello',
              _searchParams: [
                ['a', 'b'],
                ['c', 'd'],
              ],
            },
          },
        },
      }),
    ).toEqual(
      '/pluginA/foo/pluginAB/something/pluginABC/space/hello?pluginA[pluginAB][pluginABC][a]=b&pluginA[pluginAB][pluginABC][c]=d',
    )
  })

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.decode(
        '/pluginA/foo/pluginAB/something/pluginABC/space/hello?pluginA[pluginAB][pluginABC][a]=b&pluginA[pluginAB][pluginABC][c]=d',
      ),
    ).toEqual({
      pluginA: {
        id: 'foo',
        pluginAB: {
          qux: 'something',
          pluginABC: {
            arg: 'hello',
            _searchParams: [
              ['a', 'b'],
              ['c', 'd'],
            ],
          },
        },
      },
    })
  })
})

describe('url params without opt-out scoping', () => {
  const router = route.scope(
    'pluginA',
    '/pluginA/:id',
    // eslint-disable-next-line camelcase
    {__unsafe_disableScopedSearchParams: true},
    [
      route.scope('pluginAB', '/pluginAB/:qux', [
        route.scope('pluginABC', '/pluginABC/space/:arg'),
      ]),
    ],
  )

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        pluginA: {
          id: 'foo',
          pluginAB: {
            qux: 'something',
            pluginABC: {
              arg: 'hello',
              _searchParams: [
                ['a', 'b'],
                ['c', 'd'],
              ],
            },
          },
        },
      }),
    ).toEqual(
      `/pluginA/foo/pluginAB/something/pluginABC/space/hello?pluginAB[pluginABC][a]=b&pluginAB[pluginABC][c]=d`,
    )
  })
})
describe('encode with dynamically scoped url params', () => {
  const router = route.create('/tools/:tool', (state) =>
    route.scope(state.tool as string, '/edit/:documentId'),
  )

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        tool: 'structure',
        structure: {documentId: '12', _searchParams: [['a', 'b']]},
      }),
    ).toEqual('/tools/structure/edit/12?structure[a]=b')
  })
})

describe('decode with dynamically scoped url params', () => {
  const router = route.create('/tools/:tool', (state) =>
    route.scope(state.tool as string, '/edit/:documentId'),
  )

  test('UrlSearchParams params with a simple route', () => {
    expect(router.decode(`/tools/structure/edit/12?structure%5Ba%5D=b&foo=bar`)).toEqual({
      tool: 'structure',
      _searchParams: [['foo', 'bar']],
      structure: {documentId: '12', _searchParams: [['a', 'b']]},
    })
  })
})
