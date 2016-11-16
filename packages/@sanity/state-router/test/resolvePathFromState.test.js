// @flow
import test from './_util/test'
import route from '../src/route'
import type {Router} from '../src/types'
import resolvePathFromState from '../src/resolvePathFromState'

test('resolves empty state to fixed base path', t => {
  const rootRoute : Router = route('/root', [
    route('/:page', [
      route('/:productId')
    ])
  ])
  t.same(resolvePathFromState(rootRoute, {}), '/root')
})

test('throws on unresolvable state', {todo: false}, t => {
  const rootRoute = route('/root', [
    route('/:page', [
      route('/:productId')
    ])
  ])
  t.throws(() => resolvePathFromState(rootRoute, {foo: 'bar'}), /.*not mapped .* params.*foo.*/)
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
    },
  }
  t.same(resolvePathFromState(routesDef, state), '/some-dataset/tools/another-tool/omg/foo')
})
