import test from './_util/test'
import createRoute from '../src/createRoute'
import createScope from '../src/createScope'
import resolveStateFromPath from '../src/resolveStateFromPath'

test('matches a flat route', t => {
  const rootRoute = createRoute('/products/:productSlug')
  t.same(resolveStateFromPath(rootRoute, '/products/nyan-cat'), {productSlug: 'nyan-cat'})
  t.same(resolveStateFromPath(rootRoute, '/'), {})
})

test('matches all levels in a nested route definition', t => {
  const rootRoute = createRoute('/*', [
    createRoute('/products/:productSlug')
  ])
  t.same(resolveStateFromPath(rootRoute, '/products/nyan-cat'), {productSlug: 'nyan-cat'})
  t.same(resolveStateFromPath(rootRoute, '/'), {})
})

test('fails if two routes defines the same parameter', {todo: true}, t => {
  const rootRoute = createRoute('/products/:foo/:foo')
  t.throws(resolveStateFromPath(rootRoute, '/products/foo/foo'))
})

test('matches according to router scope', t => {
  const rootRoute = createRoute('/:category/*', [
    createScope('product', createRoute('/products/:productSlug/*', [
      createRoute('/:section')
    ]))
  ])

  t.same(resolveStateFromPath(rootRoute, '/'), {})

  t.same(resolveStateFromPath(rootRoute, '/imaginary-pets/products/nyan-cat/purchase'), {
    category: 'imaginary-pets',
    product: {
      productSlug: 'nyan-cat',
      section: 'purchase'
    }
  })

  t.same(resolveStateFromPath(rootRoute, '/imaginary-pets/products/nyan-cat'), {
    category: 'imaginary-pets',
    product: {
      productSlug: 'nyan-cat'
    }
  })
})
