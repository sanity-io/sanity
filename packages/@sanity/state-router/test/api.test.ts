import route from '../src/route'

test('route(options)', () => {
  const router = route({
    path: '/root/:param',
    transform: {
      param: {
        toState: param => param.toUpperCase(),
        toPath: param => param.toLowerCase()
      }
    },
    children: [route({path: '/sub/:subparam'})]
  })

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon'
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route(path, options)', () => {
  const router = route('/root/:param', {
    transform: {
      param: {
        toState: param => param.toUpperCase(),
        toPath: param => param.toLowerCase()
      }
    },
    children: [route('/sub/:subparam')]
  })

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon'
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route(path, options, children)', () => {
  const router = route(
    '/root/:param',
    {
      transform: {
        param: {
          toState: param => param.toUpperCase(),
          toPath: param => param.toLowerCase()
        }
      }
    },
    [route('/sub/:subparam')]
  )

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon'
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route(path, children)', () => {
  const router = route('/root/:param', [route('/sub/:subparam')])

  expect(router.decode('/root/banana')).toEqual({param: 'banana'})
  expect(router.encode({param: 'banana'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'banana',
    subparam: 'lemon'
  })
  expect(router.encode({param: 'banana', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('overrides conflicting params', () => {
  const router = route(
    '/this/will/be/ignored',
    {
      path: '/root/:param',
      transform: {
        param: {
          toState: param => param.toUpperCase(),
          toPath: param => param.toLowerCase()
        }
      },
      children: [route('/sub/:thiswillbeignored')]
    },
    [route('/sub/:subparam')]
  )

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon'
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})
