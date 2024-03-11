import {concat, delay, NEVER, of, take} from 'rxjs'
import {describe, expect, test} from 'vitest'

import {createContentLakeStore} from '../contentLakeStore'
import {allValuesFrom, collectNotifications, sleep} from './helpers'

describe('observing documents', () => {
  test('observing a document that does not exist on the backend', async () => {
    const store = createContentLakeStore({
      observe: id => of({type: 'sync', id, document: undefined}),
      submit: () => NEVER,
    })
    await expect(
      allValuesFrom(store.observeEvents('foo').pipe(take(1))),
    ).resolves.toEqual([
      {
        type: 'sync',
        id: 'foo',
        before: {local: undefined, remote: undefined},
        after: {local: undefined, remote: undefined},
        rebasedStage: [],
      },
    ])
  })
  test('observing a document that exist on the backend', async () => {
    const doc = {_id: 'foo', _type: 'foo'}
    const store = createContentLakeStore({
      observe: id =>
        of({type: 'sync', id, document: doc} as const).pipe(delay(10)),
      submit: () => NEVER,
    })
    await expect(
      allValuesFrom(store.observeEvents(doc._id).pipe(take(1))),
    ).resolves.toEqual([
      {
        type: 'sync',
        id: 'foo',
        after: {
          local: {_id: 'foo', _type: 'foo'},
          remote: {_id: 'foo', _type: 'foo'},
        },
        before: {local: undefined, remote: undefined},
        rebasedStage: [],
      },
    ])
  })

  test("observing a document that doesn't exist initially, but later is created", async () => {
    const doc = {_id: 'foo', _type: 'foo'}
    const store = createContentLakeStore({
      observe: id =>
        concat(
          of({type: 'sync', id, document: undefined} as const),
          of({type: 'sync', id, document: doc} as const).pipe(delay(10)),
        ),
      submit: () => NEVER,
    })
    await expect(
      allValuesFrom(store.observeEvents(doc._id).pipe(take(2))),
    ).resolves.toEqual([
      {
        type: 'sync',
        id: 'foo',
        before: {local: undefined, remote: undefined},
        after: {local: undefined, remote: undefined},
        rebasedStage: [],
      },
      {
        id: 'foo',
        type: 'sync',
        before: {local: undefined, remote: undefined},
        after: {
          local: {_id: 'foo', _type: 'foo'},
          remote: {_id: 'foo', _type: 'foo'},
        },
        rebasedStage: [],
      },
    ])
  })
})
describe('local mutations', () => {
  test('mutating a document that does not exist on the backend', () => {
    const store = createContentLakeStore({
      observe: id => of({type: 'sync', id, document: undefined}),
      submit: () => NEVER,
    })

    const {emissions, unsubscribe} = collectNotifications(
      store.observeEvents('foo'),
    )

    store.mutate([{type: 'create', document: {_id: 'foo', _type: 'foo'}}])

    expect(emissions).toEqual([
      {
        kind: 'NEXT',
        value: {
          type: 'sync',
          id: 'foo',
          after: {local: undefined, remote: undefined},
          before: {local: undefined, remote: undefined},
          rebasedStage: [
            {
              transaction: false,
              mutations: [
                {
                  type: 'create',
                  document: {_id: 'foo', _type: 'foo'},
                },
              ],
            },
          ],
        },
      },
      {
        kind: 'NEXT',
        value: {
          type: 'optimistic',
          id: 'foo',
          after: {_id: 'foo', _type: 'foo'},
          before: undefined,
          mutations: [],
          stagedChanges: [
            {
              document: {
                _id: 'foo',
                _type: 'foo',
              },
              type: 'create',
            },
          ],
        },
      },
    ])
    unsubscribe()
  })

  test("observing a document that doesn't exist initially, but later is created locally", async () => {
    const doc = {_id: 'foo', _type: 'foo'}
    const store = createContentLakeStore({
      observe: id =>
        concat(
          of({type: 'sync', id, document: undefined} as const).pipe(delay(10)),
          of({type: 'sync', id, document: doc} as const),
        ),
      submit: () => NEVER,
    })

    const {emissions, unsubscribe} = collectNotifications(
      store.observeEvents('foo'),
    )

    store.mutate([{type: 'createIfNotExists', document: doc}])

    expect(emissions).toEqual([
      {
        kind: 'NEXT',
        value: {
          type: 'optimistic',
          id: 'foo',
          after: {_id: 'foo', _type: 'foo'},
          before: undefined,
          mutations: [],
          stagedChanges: [
            {
              document: {
                _id: 'foo',
                _type: 'foo',
              },
              type: 'createIfNotExists',
            },
          ],
        },
      },
    ])

    await sleep(20)

    expect(emissions).toEqual([
      {
        kind: 'NEXT',
        value: {
          type: 'optimistic',
          id: 'foo',
          after: {_id: 'foo', _type: 'foo'},
          before: undefined,
          mutations: [],
          stagedChanges: [
            {
              document: {
                _id: 'foo',
                _type: 'foo',
              },
              type: 'createIfNotExists',
            },
          ],
        },
      },
      {
        kind: 'NEXT',
        value: {
          type: 'sync',
          id: 'foo',
          after: {local: {_id: 'foo', _type: 'foo'}, remote: undefined},
          before: {local: {_id: 'foo', _type: 'foo'}, remote: undefined},
          rebasedStage: [
            {
              transaction: false,
              mutations: [
                {
                  document: {_id: 'foo', _type: 'foo'},
                  type: 'createIfNotExists',
                },
              ],
            },
          ],
        },
      },
      {
        kind: 'NEXT',
        value: {
          type: 'sync',
          id: 'foo',
          after: {
            local: {_id: 'foo', _type: 'foo'},
            remote: {_id: 'foo', _type: 'foo'},
          },
          before: {
            local: {_id: 'foo', _type: 'foo'},
            remote: undefined,
          },
          rebasedStage: [
            {
              transaction: false,
              mutations: [
                {
                  document: {_id: 'foo', _type: 'foo'},
                  type: 'createIfNotExists',
                },
              ],
            },
          ],
        },
      },
    ])
    unsubscribe()
  })

  test("error when creating a document locally using 'create', when it turns out later that it exists on the server ", async () => {
    const doc = {_id: 'foo', _type: 'foo'}
    const store = createContentLakeStore({
      observe: id =>
        concat(of({type: 'sync', id, document: doc} as const).pipe(delay(10))),
      submit: () => NEVER,
    })

    const {emissions, unsubscribe} = collectNotifications(
      store.observeEvents('foo'),
    )

    // this will go through at first, but then we'll get an error an instant later during rebase after the document is loaded from the server
    // this is expected, and will be similar to what would have happened if the mutation was sent directly to the server
    // It might cause the document to appear for a brief time before the error is emitted though
    // Typically, consumers should use `createIfNotExists` instead of `create` to avoid this
    store.mutate([{type: 'create', document: doc}])

    expect(emissions).toEqual([
      {
        kind: 'NEXT',
        value: {
          type: 'optimistic',
          after: {_id: 'foo', _type: 'foo'},
          before: undefined,
          id: 'foo',
          mutations: [],
          stagedChanges: [
            {
              document: {
                _id: 'foo',
                _type: 'foo',
              },
              type: 'create',
            },
          ],
        },
      },
    ])

    await sleep(100)

    expect(emissions).toMatchObject([
      {
        kind: 'NEXT',
        value: {
          after: {_id: 'foo', _type: 'foo'},
          before: undefined,
          id: 'foo',
          mutations: [],
          type: 'optimistic',
        },
      },
      {kind: 'ERROR', error: {message: 'Document already exist'}},
    ])

    unsubscribe()
  })
})
