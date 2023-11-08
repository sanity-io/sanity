import {route} from '../route'

describe('decode w/UrlSearchParams', () => {
  const router = route.create('/tools/:tool', route.create('/edit/:documentId'))
  test('UrlSearchParams params with a simple route', () => {
    expect(router.decode('/tools/desk?a=b')).toEqual({
      tool: 'desk',
      _searchParams: [['a', 'b']],
    })
  })
  test('UrlSearchParams params with a nested route', () => {
    expect(router.decode('/tools/desk?view=zen')).toEqual({
      tool: 'desk',
      _searchParams: [['view', 'zen']],
    })
  })
})

describe('encode w/UrlSearchParams', () => {
  const router = route.create('/tools/:tool', route.create('/edit/:documentId'))
  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        tool: 'desk',
        _searchParams: [['a', 'b']],
      }),
    ).toEqual('/tools/desk?a=b')
  })
  test('UrlSearchParams params with a nested route', () => {
    expect(
      router.encode({
        tool: 'desk',
        _searchParams: [['view', 'zen']],
      }),
    ).toEqual('/tools/desk?view=zen')
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
      `/pluginA/foo/pluginAB/something/pluginABC/space/hello?${new URLSearchParams(
        'pluginA[pluginAB][pluginABC][a]=b&pluginA[pluginAB][pluginABC][c]=d',
      )}`,
    )
  })

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.decode(
        `/pluginA/foo/pluginAB/something/pluginABC/space/hello?${new URLSearchParams(
          'pluginA[pluginAB][pluginABC][a]=b&pluginA[pluginAB][pluginABC][c]=d',
        )}`,
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

describe('encode with dynamically scoped url params', () => {
  const router = route.create('/tools/:tool', (state) =>
    route.scope(state.tool as string, '/edit/:documentId'),
  )

  test('UrlSearchParams params with a simple route', () => {
    expect(
      router.encode({
        tool: 'desk',
        desk: {documentId: '12', _searchParams: [['a', 'b']]},
      }),
    ).toEqual(`/tools/desk/edit/12?desk%5Ba%5D=b`)
  })
})

describe('decode with dynamically scoped url params', () => {
  const router = route.create('/tools/:tool', (state) =>
    route.scope(state.tool as string, '/edit/:documentId'),
  )

  test('UrlSearchParams params with a simple route', () => {
    expect(router.decode(`/tools/desk/edit/12?desk%5Ba%5D=b&foo=bar`)).toEqual({
      tool: 'desk',
      _searchParams: [['foo', 'bar']],
      desk: {documentId: '12', _searchParams: [['a', 'b']]},
    })
  })
})
