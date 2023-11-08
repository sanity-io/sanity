import {route} from '../route'

test('route.create(options)', () => {
  const router = route.create({
    path: '/root/:param',
    transform: {
      param: {
        toState: (param) => param.toUpperCase(),
        toPath: (param) => param.toLowerCase(),
      },
    },
    children: [route.create({path: '/sub/:subparam'})],
  })

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon',
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route.create(path, options)', () => {
  const router = route.create('/root/:param', {
    transform: {
      param: {
        toState: (param) => param.toUpperCase(),
        toPath: (param) => param.toLowerCase(),
      },
    },
    children: [route.create('/sub/:subparam')],
  })

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon',
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route.create(path, options, children)', () => {
  const router = route.create(
    '/root/:param',
    {
      transform: {
        param: {
          toState: (param) => param.toUpperCase(),
          toPath: (param) => param.toLowerCase(),
        },
      },
    },
    [route.create('/sub/:subparam')],
  )

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon',
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('route.create(path, children)', () => {
  const router = route.create('/root/:param', [route.create('/sub/:subparam')])

  expect(router.decode('/root/banana')).toEqual({param: 'banana'})
  expect(router.encode({param: 'banana'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'banana',
    subparam: 'lemon',
  })
  expect(router.encode({param: 'banana', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})

test('overrides conflicting params', () => {
  const router = route.create(
    '/this/will/be/ignored',
    {
      path: '/root/:param',
      transform: {
        param: {
          toState: (param) => param.toUpperCase(),
          toPath: (param) => param.toLowerCase(),
        },
      },
      children: [route.create('/sub/:thiswillbeignored')],
    },
    [route.create('/sub/:subparam')],
  )

  expect(router.decode('/root/banana')).toEqual({param: 'BANANA'})
  expect(router.encode({param: 'BANANA'})).toEqual('/root/banana')

  expect(router.decode('/root/banana/sub/lemon')).toEqual({
    param: 'BANANA',
    subparam: 'lemon',
  })
  expect(router.encode({param: 'BANANA', subparam: 'lemon'})).toEqual('/root/banana/sub/lemon')
})
