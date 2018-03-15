// @flow
import test from './_util/test'
import route from '../src/route'
import type {Router} from '../src/types'
import resolvePathFromState from '../src/resolvePathFromState'

test('resolves empty state to fixed base path', t => {
  const rootRoute: Router = route('/root', [route('/:page', [route('/:productId')])])
  t.same(resolvePathFromState(rootRoute, {}), '/root')
})

test('throws on unresolvable state', t => {
  const rootRoute = route('/root', [route('/:page', [route('/:productId')])])
  t.throws(
    () => resolvePathFromState(rootRoute, {foo: 'bar'}),
    new Error(
      'Unable to find matching route for state. Could not map the following state key to a valid url: foo'
    )
  )
})

test('points to unmapped keys', t => {
  const routesDef = route('/:dataset', [
    route('/settings/:setting'),
    route('/tools/:tool', params => {
      if (params.tool === 'desk') {
        return [route.scope('desk', '/collections/:collection')]
      }
      if (params.tool === 'another-tool') {
        return [route.scope('foo', '/omg/:nope')]
      }
    })
  ])
  const state = {
    dataset: 'some-dataset',
    tool: 'another-tool',
    foo: {
      nop: 'bar'
    }
  }
  t.throws(
    () => resolvePathFromState(routesDef, state),
    new Error(
      'Unable to find matching route for state. Could not map the following state keys to a valid url: tool, foo'
    )
  )
})

test('Resolves this', t => {
  const routesDef = route('/:dataset', [
    route('/settings/:setting'),
    route('/tools/:tool', params => {
      if (params.tool === 'desk') {
        return [route.scope('desk', '/collections/:collection')]
      }
      if (params.tool === 'another-tool') {
        return [route.scope('foo', '/omg/:nope')]
      }
    })
  ])
  const state = {
    dataset: 'some-dataset',
    tool: 'another-tool',
    foo: {
      nope: 'foo'
    }
  }
  t.same(resolvePathFromState(routesDef, state), '/some-dataset/tools/another-tool/omg/foo')
})
