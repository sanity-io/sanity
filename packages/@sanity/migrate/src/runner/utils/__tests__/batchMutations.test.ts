import {toArray} from '../../../it-utils'
import {batchMutations} from '../batchMutations'

function byteLength(obj: unknown) {
  return JSON.stringify(obj).length
}

describe('mutation payload batching', () => {
  test('when everything fits into a single mutation request', async () => {
    const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
    const second = {patch: {id: 'foo', set: {bar: 'baz'}}}
    const gen = async function* () {
      yield first
      yield second
    }

    const firstSize = JSON.stringify(first).length
    const secondSize = JSON.stringify(second).length

    const it = batchMutations(gen(), firstSize + secondSize)

    expect(await it.next()).toEqual({value: {mutations: [first, second]}, done: false})
    expect(await it.next()).toEqual({value: undefined, done: true})
  })

  test('when max batch is not big enough to fit all values', async () => {
    const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
    const second = {patch: {id: 'foo', set: {bar: 'baz'}}}
    const gen = async function* () {
      yield first
      yield second
    }

    const firstSize = JSON.stringify(first).length

    const it = batchMutations(gen(), firstSize)

    expect(await it.next()).toEqual({value: {mutations: [first]}, done: false})
    expect(await it.next()).toEqual({value: {mutations: [second]}, done: false})
    expect(await it.next()).toEqual({value: undefined, done: true})
  })

  test('when each mutation is bigger than max batch size', async () => {
    const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
    const second = {patch: {id: 'foo', set: {bar: 'baz'}}}
    const gen = async function* () {
      yield first
      yield second
    }

    const it = batchMutations(gen(), 1)

    expect(await it.next()).toEqual({value: {mutations: [first]}, done: false})
    expect(await it.next()).toEqual({value: {mutations: [second]}, done: false})
    expect(await it.next()).toEqual({value: undefined, done: true})
  })

  test('when some mutations can be chunked, others not', async () => {
    const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
    const second = {patch: {id: 'foo', set: {bar: 'baz'}}}

    // Note: this is an array of mutations and should not be split up as it may be intentional to keep it in a transaction
    // todo: is it ok to include other mutations in the same batch as a transaction?
    const third = [
      {
        createOrReplace: {
          _id: 'foo',
          _type: 'something',
          bar: 'baz',
          baz: 'qux',
        },
      },
      {patch: {id: 'foo', set: {bar: 'baz'}}},
    ]

    const gen = async function* () {
      yield first
      yield second
      yield third
    }
    const it = batchMutations(gen(), byteLength(first) + byteLength(second))

    expect(await it.next()).toEqual({value: {mutations: [first, second]}, done: false})
    expect(await it.next()).toEqual({value: {mutations: third}, done: false})
  })
})

//todo: verify if this is the default behavior we want
test('transactions are always in the same batch, but might include other mutations if they fit', async () => {
  const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
  const second = {patch: {id: 'foo', set: {bar: 'baz'}}}

  // Note: this is an array of mutations and should not be split up as it may be intentional to keep it in a transaction
  const transaction = {
    mutations: [
      {
        createOrReplace: {
          _id: 'foo',
          _type: 'something',
          bar: 'baz',
          baz: 'qux',
        },
      },
      {patch: {id: 'foo', set: {bar: 'baz'}}},
    ],
  }

  const fourth = {patch: {id: 'another', set: {this: 'that'}}}

  const gen = async function* () {
    yield first
    yield second
    yield transaction
    yield fourth
  }
  const it = batchMutations(
    gen(),
    [first, second, transaction, fourth].reduce((l, m) => l + byteLength(m), 0),
  )

  expect(await toArray(it)).toEqual([
    {mutations: [first, second]},
    transaction,
    {mutations: [fourth]},
  ])
  expect(await it.next()).toEqual({value: undefined, done: true})
})

test('transactions are always batched as-is if preserveTransactions: true', async () => {
  const first = {createIfNotExists: {_id: 'foo', _type: 'something', bar: 'baz'}}
  const second = {patch: {id: 'foo', set: {bar: 'baz'}}}

  // Note: this is an array of mutations and should not be split up as it may be intentional to keep it in a transaction
  const transaction = {
    mutations: [
      {
        createOrReplace: {
          _id: 'foo',
          _type: 'something',
          bar: 'baz',
          baz: 'qux',
        },
      },
      {patch: {id: 'foo', set: {bar: 'baz'}}},
    ],
  }

  const fourth = {patch: {id: 'another', set: {this: 'that'}}}

  const gen = async function* () {
    yield first
    yield second
    yield transaction
    yield fourth
  }
  const it = batchMutations(
    gen(),
    [first, second, transaction, fourth].reduce((l, m) => l + byteLength(m), 0),
  )

  expect(await it.next()).toEqual({value: {mutations: [first, second]}, done: false})
  expect(await it.next()).toEqual({value: transaction, done: false})
  expect(await it.next()).toEqual({value: {mutations: [fourth]}, done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})
