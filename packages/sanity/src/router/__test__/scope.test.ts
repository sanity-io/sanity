import {route} from '../route'

test('toplevel', () => {
  const router = route.scope('omg', '/foo/:bar')
  expect(router.decode('/foo/bar')).toEqual({omg: {bar: 'bar'}})
  expect(router.encode({omg: {bar: 'bar'}})).toBe('/foo/bar')
})

test('toplevel, with params', () => {
  const router = route.scope('omg', '/foo/:bar')
  expect(router.decode('/foo/bar?omg[something]=xyz')).toEqual({
    omg: {bar: 'bar', _searchParams: [['something', 'xyz']]},
  })
  expect(router.encode({omg: {bar: 'bar', _searchParams: [['something', 'xyz']]}})).toBe(
    '/foo/bar?omg[something]=xyz',
  )
})

test('scopes all the way down', () => {
  const router = route.scope('first', '/foo/:bar', [
    route.scope('second', '/baz/:qux', [route.scope('third', '/omg/:lol')]),
  ])

  expect(router.decode('/foo/bar')).toEqual({first: {bar: 'bar'}})
  expect('/foo/bar').toBe(router.encode({first: {bar: 'bar'}}))

  expect({first: {bar: 'bar', second: {qux: 'qux'}}}).toEqual(router.decode('/foo/bar/baz/qux'))
  expect(router.encode({first: {bar: 'bar', second: {qux: 'qux'}}})).toBe('/foo/bar/baz/qux')

  expect({
    first: {
      bar: 'bar',
      second: {
        qux: 'qux',
        third: {
          lol: 'lol',
        },
      },
    },
  }).toEqual(router.decode('/foo/bar/baz/qux/omg/lol'))
  expect('/foo/bar/baz/qux/omg/lol').toEqual(
    router.encode({
      first: {
        bar: 'bar',
        second: {
          qux: 'qux',
          third: {
            lol: 'lol',
          },
        },
      },
    }),
  )
})

test('scopes all the way down, with params', () => {
  const router = route.scope('first', '/foo/:bar', [
    route.scope('second', '/baz/:qux', [route.scope('third', '/omg/:lol')]),
  ])

  expect(router.decode('/foo/bar?first[a]=b')).toEqual({
    first: {bar: 'bar', _searchParams: [['a', 'b']]},
  })

  expect(router.encode({first: {bar: 'bar', _searchParams: [['a', 'b']]}})).toBe(
    '/foo/bar?first[a]=b',
  )

  expect(router.decode('/foo/bar/baz/qux?first[a]=b&first[second][c]=d')).toEqual({
    first: {
      bar: 'bar',
      _searchParams: [['a', 'b']],
      second: {qux: 'qux', _searchParams: [['c', 'd']]},
    },
  })
  expect(
    router.encode({
      first: {
        bar: 'bar',
        _searchParams: [['a', 'b']],
        second: {qux: 'qux', _searchParams: [['c', 'd']]},
      },
    }),
  ).toBe('/foo/bar/baz/qux?first[a]=b&first[second][c]=d')

  expect(
    router.decode(
      '/foo/bar/baz/qux/omg/lol?first[x]=1&first[y]=2&first[second][a]=0&first[second][b]=1&first[second][third][foo]=bar',
    ),
  ).toEqual({
    first: {
      bar: 'bar',
      _searchParams: [
        ['x', '1'],
        ['y', '2'],
      ],
      second: {
        _searchParams: [
          ['a', '0'],
          ['b', '1'],
        ],
        qux: 'qux',
        third: {
          _searchParams: [['foo', 'bar']],
          lol: 'lol',
        },
      },
    },
  })
  expect(
    router.encode({
      first: {
        bar: 'bar',
        _searchParams: [
          ['x', '1'],
          ['y', '2'],
        ],
        second: {
          _searchParams: [
            ['a', '0'],
            ['b', '1'],
          ],
          qux: 'qux',
          third: {
            _searchParams: [['foo', 'bar']],
            lol: 'lol',
          },
        },
      },
    }),
  ).toEqual(
    '/foo/bar/baz/qux/omg/lol?first[x]=1&first[y]=2&first[second][a]=0&first[second][b]=1&first[second][third][foo]=bar',
  )
})
