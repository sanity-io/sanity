import {type SanityClient} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {concat, NEVER, of, Subject} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type StoredQueries, useSavedQueries} from './useSavedQueries'

const mocks = vi.hoisted(() => ({
  store: {
    value: null as StoredQueries | null,
    failWrite: undefined as ((next: StoredQueries) => boolean) | undefined,
  },
  setKey: vi.fn(),
  sharedDocs: [] as {_id: string; authorId: string; savedAt: string; url: string; title?: string}[],
  create: vi.fn(),
  deleteDoc: vi.fn(),
}))

// Everything the store emits after its initial read: a read that resolves late, a write's own
// event, a write made elsewhere
let storeEvents = new Subject<StoredQueries | null>()

// The hook keys its subscriptions on these objects, so they must be stable across renders
const keyValueStore = {
  getKey: () => concat(of(mocks.store.value), storeEvents),
  setKey: mocks.setKey,
}
const client = {
  fetch: () => Promise.resolve(mocks.sharedDocs),
  observable: {listen: () => NEVER},
  create: mocks.create,
  delete: mocks.deleteDoc,
} as unknown as SanityClient
const currentUser = {id: 'user-1'}

vi.mock('sanity', () => ({
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'X'},
  useKeyValueStore: () => keyValueStore,
  useClient: () => client,
  useCurrentUser: () => currentUser,
}))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('useSavedQueries', () => {
  afterEach(() => {
    vi.clearAllMocks()
    mocks.store.value = null
    mocks.store.failWrite = undefined
    mocks.sharedDocs = []
    storeEvents = new Subject()
  })

  function setup() {
    let created = 0
    mocks.setKey.mockImplementation(async (_key: string, next: StoredQueries) => {
      // Slow enough for calls to overlap
      await wait(10)
      if (mocks.store.failWrite?.(next)) {
        throw new Error('store is read-only')
      }
      mocks.store.value = next
      return next
    })
    mocks.create.mockImplementation(async (doc: Record<string, unknown>) => {
      await wait(5)
      created += 1
      return {...doc, _id: `shared-${created}`}
    })
    mocks.deleteDoc.mockImplementation(async () => {
      await wait(5)
    })
    return renderHook(() => useSavedQueries())
  }

  it('keeps every query when saves overlap, since each write starts from the previous one', async () => {
    const {result} = setup()

    let saves: Promise<string[]>
    act(() => {
      saves = Promise.all([
        result.current.saveQuery({url: 'https://a', savedAt: '2026-01-01T00:00:00Z'}),
        result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'}),
      ])
    })
    await act(async () => {
      await saves
    })

    expect(mocks.store.value?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('keeps a saved query when a store read from before the save lands after it', async () => {
    const {result} = setup()

    await act(async () => {
      await result.current.saveQuery({url: 'https://a', savedAt: '2026-01-01T00:00:00Z'})
    })
    act(() => {
      storeEvents.next({queries: []})
    })
    await act(async () => {
      await result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })

    expect(mocks.store.value?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('keeps the queries when clearing them fails, store event and all', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z'}],
    }
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    mocks.store.failWrite = () => true

    let clear: Promise<unknown>
    act(() => {
      clear = result.current.clearQueries()
      // The store emits the list a write holds before it knows whether the write went through
      storeEvents.next({queries: []})
    })
    await act(async () => {
      await expect(clear).rejects.toThrow('store is read-only')
    })

    expect(result.current.queries.map((query) => query.url)).toEqual(['https://a'])

    // The next write starts from the list the store still holds, rather than from the empty one
    mocks.store.failWrite = undefined
    await act(async () => {
      await result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })

    expect(mocks.store.value?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('moves both queries when unshares overlap', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
      {_id: 'shared-b', authorId: 'user-1', savedAt: '2026-01-02T00:00:00Z', url: 'https://b'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(2))

    let moves: Promise<void[]>
    act(() => {
      moves = Promise.all([
        result.current.unshareQuery('shared-a'),
        result.current.unshareQuery('shared-b'),
      ])
    })
    await act(async () => {
      await moves
    })

    expect(mocks.store.value?.queries.map((query) => query.url).toSorted()).toEqual([
      'https://a',
      'https://b',
    ])
    expect(mocks.deleteDoc.mock.calls.map(([id]) => String(id)).toSorted()).toEqual([
      'shared-a',
      'shared-b',
    ])
    expect(result.current.queries.every((query) => !query.shared)).toBe(true)
  })

  it('takes a shared copy back when the personal one cannot be removed', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z', title: 'A'}],
    }
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    // Only the removal fails; adding queries keeps working
    mocks.store.failWrite = (next) => next.queries.length === 0

    let move: Promise<void>
    act(() => {
      move = result.current.shareQuery('p1')
    })
    await act(async () => {
      await expect(move).rejects.toThrow('store is read-only')
    })

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.deleteDoc).toHaveBeenCalledWith('shared-1')
    expect(result.current.queries.map((query) => [query._key, query.shared])).toEqual([
      ['p1', undefined],
    ])
    expect(mocks.store.value?.queries).toHaveLength(1)
  })
})
