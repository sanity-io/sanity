// @flow
import test from './_util/test'
import route from '../src/route'

test('route(options)', t => {
  const router = route('/some/basepath', [route('/:param')])

  t.same(router.decode('/some/basepath'), {})
  t.same(router.encode({}), '/some/basepath')
  t.same(router.encode({param: 'foo'}), '/some/basepath/foo')
})
