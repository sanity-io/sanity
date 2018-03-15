// @flow
import test from './_util/test'
import route from '../src/route'

test('route(options)', t => {
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

  t.same(router.decode('/root/banana'), {param: 'BANANA'})
  t.same(router.encode({param: 'BANANA'}), '/root/banana')

  t.same(router.decode('/root/banana/sub/lemon'), {param: 'BANANA', subparam: 'lemon'})
  t.same(router.encode({param: 'BANANA', subparam: 'lemon'}), '/root/banana/sub/lemon')
})

test('route(path, options)', t => {
  const router = route('/root/:param', {
    transform: {
      param: {
        toState: param => param.toUpperCase(),
        toPath: param => param.toLowerCase()
      }
    },
    children: [route('/sub/:subparam')]
  })

  t.same(router.decode('/root/banana'), {param: 'BANANA'})
  t.same(router.encode({param: 'BANANA'}), '/root/banana')

  t.same(router.decode('/root/banana/sub/lemon'), {param: 'BANANA', subparam: 'lemon'})
  t.same(router.encode({param: 'BANANA', subparam: 'lemon'}), '/root/banana/sub/lemon')
})

test('route(path, options, children)', t => {
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

  t.same(router.decode('/root/banana'), {param: 'BANANA'})
  t.same(router.encode({param: 'BANANA'}), '/root/banana')

  t.same(router.decode('/root/banana/sub/lemon'), {param: 'BANANA', subparam: 'lemon'})
  t.same(router.encode({param: 'BANANA', subparam: 'lemon'}), '/root/banana/sub/lemon')
})

test('route(path, children)', t => {
  const router = route('/root/:param', [route('/sub/:subparam')])

  t.same(router.decode('/root/banana'), {param: 'banana'})
  t.same(router.encode({param: 'banana'}), '/root/banana')

  t.same(router.decode('/root/banana/sub/lemon'), {param: 'banana', subparam: 'lemon'})
  t.same(router.encode({param: 'banana', subparam: 'lemon'}), '/root/banana/sub/lemon')
})

test('overrides conflicting params', t => {
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

  t.same(router.decode('/root/banana'), {param: 'BANANA'})
  t.same(router.encode({param: 'BANANA'}), '/root/banana')

  t.same(router.decode('/root/banana/sub/lemon'), {param: 'BANANA', subparam: 'lemon'})
  t.same(router.encode({param: 'BANANA', subparam: 'lemon'}), '/root/banana/sub/lemon')
})
