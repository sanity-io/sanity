// @flow
import test from './_util/test'
import route from '../src/route'
import {decodeParams, encodeParams} from '../src/utils/paramsEncoding'

test('transform config on regular routes', t => {
  const router = route(
    '/some/:section/:settings',
    {
      transform: {
        settings: {
          toState: decodeParams,
          toPath: encodeParams
        }
      }
    },
    route('/other/:page')
  )

  t.same(router.decode('/some/bar/width=full;view=details'), {
    section: 'bar',
    settings: {
      width: 'full',
      view: 'details'
    }
  })
  t.same(
    router.encode({
      section: 'bar',
      settings: {
        width: 'full',
        view: 'details'
      }
    }),
    '/some/bar/width=full;view=details'
  )

  t.same(
    router.encode({
      section: 'bar',
      settings: {
        width: 'full'
      }
    }),
    '/some/bar/width=full'
  )

  t.same(
    router.encode({
      section: 'bar',
      page: 'stuff',
      settings: {
        foo: 'bar'
      }
    }),
    '/some/bar/foo=bar/other/stuff'
  )
})
test('transform config on scoped routes', t => {
  const router = route('/some/:section', [
    route('/other/:params', {
      scope: 'myscope',
      transform: {
        params: {
          toState: decodeParams,
          toPath: encodeParams
        }
      }
    })
  ])

  t.same(router.decode('/some/foo/other/width=full;view=details'), {
    section: 'foo',
    myscope: {
      params: {
        width: 'full',
        view: 'details'
      }
    }
  })

  t.same(
    router.encode({
      section: 'foo',
      myscope: {
        params: {
          width: 'full',
          view: 'details'
        }
      }
    }),
    '/some/foo/other/width=full;view=details'
  )
})
