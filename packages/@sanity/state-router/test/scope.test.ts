import route from '../src/route'

test('toplevel', () => {
  const router = route.scope('omg', '/foo/:bar')
  expect(router.decode('/foo/bar')).toEqual({omg: {bar: 'bar'}})
  expect(router.encode({omg: {bar: 'bar'}})).toBe('/foo/bar')
})

test('scopes all the way down', () => {
  const router = route.scope('first', '/foo/:bar', [
    route.scope('second', '/baz/:qux', [route.scope('third', '/omg/:lol')]),
  ])

  expect({first: {bar: 'bar'}}).toEqual(router.decode('/foo/bar'))
  expect('/foo/bar').toBe(router.encode({first: {bar: 'bar'}}))

  expect({first: {bar: 'bar', second: {qux: 'qux'}}}).toEqual(router.decode('/foo/bar/baz/qux'))
  expect('/foo/bar/baz/qux').toBe(router.encode({first: {bar: 'bar', second: {qux: 'qux'}}}))

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
    })
  )
})
