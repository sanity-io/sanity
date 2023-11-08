import {route} from '../route'

test('route(options)', () => {
  const router = route.create('/some/basepath', [route.create('/:param')])

  expect(router.decode('/some/basepath')).toEqual({})
  expect(router.encode({})).toEqual('/some/basepath')
  expect(router.encode({param: 'foo'})).toEqual('/some/basepath/foo')
})
