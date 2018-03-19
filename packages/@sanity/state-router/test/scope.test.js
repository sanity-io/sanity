// @flow
import test from './_util/test'
import {route} from '../src'

test('toplevel', t => {
  const router = route.scope('omg', '/foo/:bar')
  t.same(router.decode('/foo/bar'), {omg: {bar: 'bar'}})
  t.same(router.encode({omg: {bar: 'bar'}}), '/foo/bar')
})

test('scopes all the way down', t => {
  const router = route.scope('first', '/foo/:bar', [
    route.scope('second', '/baz/:qux', [route.scope('third', '/omg/:lol')])
  ])

  t.same({first: {bar: 'bar'}}, router.decode('/foo/bar'))
  t.same('/foo/bar', router.encode({first: {bar: 'bar'}}))

  t.same({first: {bar: 'bar', second: {qux: 'qux'}}}, router.decode('/foo/bar/baz/qux'))
  t.same('/foo/bar/baz/qux', router.encode({first: {bar: 'bar', second: {qux: 'qux'}}}))

  t.same(
    {
      first: {
        bar: 'bar',
        second: {
          qux: 'qux',
          third: {
            lol: 'lol'
          }
        }
      }
    },
    router.decode('/foo/bar/baz/qux/omg/lol')
  )
  t.same(
    '/foo/bar/baz/qux/omg/lol',
    router.encode({
      first: {
        bar: 'bar',
        second: {
          qux: 'qux',
          third: {
            lol: 'lol'
          }
        }
      }
    })
  )
})
