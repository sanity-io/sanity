import {route} from '../route'
import {decodeParams, encodeParams} from '../utils/paramsEncoding'

test('transform config on regular routes', () => {
  const router = route.create(
    '/some/:section/:settings',
    {
      transform: {
        settings: {
          toState: decodeParams,
          toPath: encodeParams,
        },
      },
    },
    route.create('/other/:page'),
  )

  expect(router.decode('/some/bar/width=full;view=details')).toEqual({
    section: 'bar',
    settings: {
      width: 'full',
      view: 'details',
    },
  })
  expect(
    router.encode({
      section: 'bar',
      settings: {
        width: 'full',
        view: 'details',
      },
    }),
  ).toBe('/some/bar/width=full;view=details')

  expect(
    router.encode({
      section: 'bar',
      settings: {
        width: 'full',
      },
    }),
  ).toBe('/some/bar/width=full')

  expect(
    router.encode({
      section: 'bar',
      page: 'stuff',
      settings: {
        foo: 'bar',
      },
    }),
  ).toBe('/some/bar/foo=bar/other/stuff')
})

test('transform config on scoped routes', () => {
  const router = route.create('/some/:section', [
    route.create('/other/:params', {
      scope: 'myscope',
      transform: {
        params: {
          toState: decodeParams,
          toPath: encodeParams,
        },
      },
    }),
  ])

  expect(router.decode('/some/foo/other/width=full;view=details')).toEqual({
    section: 'foo',
    myscope: {
      params: {
        width: 'full',
        view: 'details',
      },
    },
  })

  expect(
    router.encode({
      section: 'foo',
      myscope: {
        params: {
          width: 'full',
          view: 'details',
        },
      },
    }),
  ).toBe('/some/foo/other/width=full;view=details')
})
