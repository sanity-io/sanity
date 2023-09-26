import {route} from '../route'

test('only route', () => {
  const router = route.create('/foo/:bar')
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('null options', () => {
  const router = route.create('/foo/:bar', null)
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('empty children', () => {
  const router = route.create('/foo/:bar', [])
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('nonempty children', () => {
  const router = route.create('/foo/:bar', [route.create('/:baz')])
  expect(router.decode('/foo/bar/baz')).toEqual({bar: 'bar', baz: 'baz'})
})

test('children and options', () => {
  const router = route.scope('foobar', '/foo/:bar', [route.create('/:baz')])
  expect(router.decode('/foo/bar/baz')).toEqual({foobar: {bar: 'bar', baz: 'baz'}})
})
