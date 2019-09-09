import route from '../src/route'

test('route(options)', () => {
  const router = route('/some/basepath', [route('/:param')])

  expect(router.decode('/some/basepath')).toEqual({})
  expect(router.encode({})).toEqual('/some/basepath')
  expect(router.encode({param: 'foo'})).toEqual('/some/basepath/foo')
})
