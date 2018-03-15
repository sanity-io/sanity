// @flow
import test from './_util/test'
import route from '../src/route'

const router = route('/', [
  route('/animals/:animal'),
  route('/countries', [
    route('/:country', [route('/:county', [route('/:municipality')])]),
    route('/:country/:county'),
    route('/:country/:county/:municipality/neighbors/:neighbor')
  ])
])

test('root', t => {
  t.same('/', router.encode({}))
  t.same({}, router.decode('/'))
})

test('cow', t => {
  t.same(router.encode({animal: 'cow'}), '/animals/cow')
  t.same(router.decode('/animals/cow'), {animal: 'cow'})
})

test('sweden', t => {
  t.same(router.encode({country: 'sweden'}), '/countries/sweden')
  t.same(router.decode('/countries/sweden'), {country: 'sweden'})
})

test('finnmark', t => {
  t.same(router.encode({country: 'norway', county: 'finnmark'}), '/countries/norway/finnmark')
  t.same(router.decode('/countries/norway/finnmark'), {country: 'norway', county: 'finnmark'})
})

test('kautokeino', t => {
  const path = '/countries/norway/finnmark/kautokeino'
  const state = {municipality: 'kautokeino', country: 'norway', county: 'finnmark'}
  t.same(router.encode(state), path)
  t.same(router.decode(path), state)
})

test('murmansk', t => {
  const path = '/countries/norway/finnmark/kautokeino/neighbors/murmansk'
  const state = {
    neighbor: 'murmansk',
    municipality: 'kautokeino',
    country: 'norway',
    county: 'finnmark'
  }
  t.same(router.encode(state), path)
  t.same(router.decode(path), state)
})
