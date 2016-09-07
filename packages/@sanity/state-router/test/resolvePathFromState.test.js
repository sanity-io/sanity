import test from './_util/test'
import createRoute from '../src/createRoute'
import createScope from '../src/createScope'
import resolvePathFromState from '../src/resolvePathFromState'

test('resolves empty state to fixed base path', t => {
  const rootRoute = createRoute('/root/*', [
    createRoute('/:page', [
      createRoute('/:productId')
    ])
  ])
  t.same(resolvePathFromState(rootRoute, {}), '/root')
})

test('throws on unresolvable state', {todo: true}, t => {
  const rootRoute = createRoute('/root/*', [
    createRoute('/:page', [
      createRoute('/:productId')
    ])
  ])
  t.throws(() => resolvePathFromState(rootRoute, {foo: 'bar'}), new Error('Unmappable state keys remaining: foo'))
})

test('Resolves this', t => {
  const routesDef = createRoute('/:dataset/*', [
    createRoute('/settings/:setting'),
    createRoute('/tools/:tool/*', params => {
      if (params.tool === 'desk') {
        return createScope('desk', createRoute('/collections/:collection'))
      }
      if (params.tool === 'another-tool') {
        return createScope('foo', createRoute('/omg/:nope'))
      }
    })
  ])
  const state = {
    dataset: 'some-dataset',
    tool: 'another-tool',
    'foo': {
      nope: 'foo'
    },
  }
  t.same(resolvePathFromState(routesDef, state), '/some-dataset/tools/another-tool/omg/foo')
})
