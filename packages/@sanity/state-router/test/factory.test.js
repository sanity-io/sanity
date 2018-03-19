// @flow
import test from './_util/test'
import {route} from '../src'

test('only route', t => {
  const router = route('/foo/:bar')
  t.same(router.decode('/foo/bar'), {bar: 'bar'})
})

test('null options', t => {
  const router = route('/foo/:bar', null)
  t.same(router.decode('/foo/bar'), {bar: 'bar'})
})

test('empty children', t => {
  const router = route('/foo/:bar', [])
  t.same(router.decode('/foo/bar'), {bar: 'bar'})
})

test('nonempty children', t => {
  const router = route('/foo/:bar', [route('/:baz')])
  t.same(router.decode('/foo/bar/baz'), {bar: 'bar', baz: 'baz'})
})

test('children and options', t => {
  const router = route.scope('foobar', '/foo/:bar', [route('/:baz')])
  t.same(router.decode('/foo/bar/baz'), {foobar: {bar: 'bar', baz: 'baz'}})
})
