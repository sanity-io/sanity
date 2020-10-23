import route from '../src/route'

const router = route('/', [
  route('/animals/:animal'),
  route('/countries', [
    route('/:country', [route('/:county', [route('/:municipality')])]),
    route('/:country/:county'),
    route('/:country/:county/:municipality/neighbors/:neighbor'),
  ]),
])

test('root', () => {
  expect('/').toBe(router.encode({}))
  expect({}).toEqual(router.decode('/'))
})

test('cow', () => {
  expect(router.encode({animal: 'cow'})).toBe('/animals/cow')
  expect(router.decode('/animals/cow')).toEqual({animal: 'cow'})
})

test('sweden', () => {
  expect(router.encode({country: 'sweden'})).toBe('/countries/sweden')
  expect(router.decode('/countries/sweden')).toEqual({country: 'sweden'})
})

test('finnmark', () => {
  expect(router.encode({country: 'norway', county: 'finnmark'})).toBe('/countries/norway/finnmark')
  expect(router.decode('/countries/norway/finnmark')).toEqual({
    country: 'norway',
    county: 'finnmark',
  })
})

test('kautokeino', () => {
  const path = '/countries/norway/finnmark/kautokeino'
  const state = {
    municipality: 'kautokeino',
    country: 'norway',
    county: 'finnmark',
  }
  expect(router.encode(state)).toBe(path)
  expect(router.decode(path)).toEqual(state)
})

test('murmansk', () => {
  const path = '/countries/norway/finnmark/kautokeino/neighbors/murmansk'
  const state = {
    neighbor: 'murmansk',
    municipality: 'kautokeino',
    country: 'norway',
    county: 'finnmark',
  }
  expect(router.encode(state)).toBe(path)
  expect(router.decode(path)).toEqual(state)
})
