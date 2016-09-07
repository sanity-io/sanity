import test from './_util/test'
import inspect from 'object-inspect'
import createRoute from '../src/createRoute'
import createScope from '../src/createScope'
import resolveStateFromPath from '../src/resolveStateFromPath'
import resolvePathFromState from '../src/resolvePathFromState'

function testRoute(path, state) {
  test(`path ${path} resolves to state ${inspect(state)}`, t => {
    t.same(resolveStateFromPath(routesDef, path), state)
  })
  test(`state ${inspect(state)} produces path ${path}`, t => {
    t.same(resolvePathFromState(routesDef, state), path)
  })
}

const routesDef = createRoute('/:dataset/*', [
  createRoute('/settings/:setting'),
  createRoute('/tools/:tool/*', params => {
    if (params.tool === 'desk') {
      return createScope('desk', createRoute('/collections/:collection'))
    }
    if (params.tool === 'another-tool') {
      return createScope('another-tool', createRoute('/omg/:nope'))
    }
  })
])

test('path resolution works with unknown params', t => {
  t.same(resolvePathFromState(routesDef, {unknown: 'property'}), '/')
})

const equivalents = [
  ['/', {}],
  ['/some-dataset', {dataset: 'some-dataset'}],
  ['/some-dataset/tools/desk', {dataset: 'some-dataset', tool: 'desk'}],
  ['/some-dataset/settings/desk', {
    dataset: 'some-dataset',
    setting: 'desk'
  }],
  ['/some-dataset/tools/desk', {
    dataset: 'some-dataset',
    tool: 'desk'
  }],
  ['/some-dataset/tools/desk/collections/articles', {
    dataset: 'some-dataset',
    tool: 'desk',
    desk: {
      collection: 'articles'
    }
  }],
  ['/some-dataset/tools/another-tool/omg/foo', {
    dataset: 'some-dataset',
    tool: 'another-tool',
    'another-tool': {
      nope: 'foo'
    }
  }],
  ['/some-dataset/tools/another-tool/omg/foo', {
    dataset: 'some-dataset',
    tool: 'another-tool',
    'another-tool': {
      nope: 'foo'
    }
  }],
]

equivalents.forEach(([path, state]) => testRoute(path, state))