import {route} from '../src'

test('only route', () => {
  const router = route('/foo/:bar')
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('null options', () => {
  const router = route('/foo/:bar', null)
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('empty children', () => {
  const router = route('/foo/:bar', [])
  expect(router.decode('/foo/bar')).toEqual({bar: 'bar'})
})

test('nonempty children', () => {
  const router = route('/foo/:bar', [route('/:baz')])
  expect(router.decode('/foo/bar/baz')).toEqual({bar: 'bar', baz: 'baz'})
})

test('children and options', () => {
  const router = route.scope('foobar', '/foo/:bar', [route('/:baz')])
  expect(router.decode('/foo/bar/baz')).toEqual({foobar: {bar: 'bar', baz: 'baz'}})
})
