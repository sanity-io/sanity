import {route} from '../route'
import {Router} from '../types'
import {_resolvePathFromState} from '../_resolvePathFromState'

test('resolves empty state to fixed base path', () => {
  const rootRoute: Router = route.create('/root', [
    route.create('/:page', [route.create('/:productId')]),
  ])
  expect(_resolvePathFromState(rootRoute, {})).toEqual('/root')
})

test('throws on unresolvable state', () => {
  const rootRoute = route.create('/root', [route.create('/:page', [route.create('/:productId')])])
  expect(() => _resolvePathFromState(rootRoute, {foo: 'bar'})).toThrow(
    'Unable to find matching route for state. Could not map the following state key to a valid url: foo',
  )
})

test('points to unmapped keys', () => {
  const routesDef = route.create('/:dataset', [
    route.create('/settings/:setting'),
    route.create('/tools/:tool', (params: any): any => {
      if (params.tool === 'desk') {
        return [route.scope('desk', '/collections/:collection')]
      }
      if (params.tool === 'another-tool') {
        return [route.scope('foo', '/omg/:nope')]
      }
      return undefined
    }),
  ])
  const state = {
    dataset: 'some-dataset',
    tool: 'another-tool',
    foo: {
      nop: 'bar',
    },
  }
  expect(() => _resolvePathFromState(routesDef, state)).toThrow(
    'Unable to find matching route for state. Could not map the following state keys to a valid url: tool, foo',
  )
})

test('Resolves this', () => {
  const routesDef = route.create('/:dataset', [
    route.create('/settings/:setting'),
    route.create('/tools/:tool', (params: any): any => {
      if (params.tool === 'desk') {
        return [route.scope('desk', '/collections/:collection')]
      }
      if (params.tool === 'another-tool') {
        return [route.scope('foo', '/omg/:nope')]
      }
      return undefined
    }),
  ])
  const state = {
    dataset: 'some-dataset',
    tool: 'another-tool',
    foo: {
      nope: 'foo',
    },
  }
  expect(_resolvePathFromState(routesDef, state)).toBe('/some-dataset/tools/another-tool/omg/foo')
})
