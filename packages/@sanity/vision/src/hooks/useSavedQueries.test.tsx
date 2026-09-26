import {type SanityClient} from '@sanity/client'
import {act, cleanup, render, renderHook, waitFor} from '@testing-library/react'
import {Activity, useEffect} from 'react'
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

// What the store emits after its synchronous first value: a server read resolving late, a
// write's own event, a write made elsewhere
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
/** Read through a call so a `mocks.store.value = null` earlier in a test does not narrow it away */
const storedUrls = () => mocks.store.value?.queries.map((query) => query.url)
/** A mutable slot for what a component reports from its effects */
function slot<T>(): {current: T | null} {
  return {current: null}
}

describe('useSavedQueries', () => {
  afterEach(() => {
    cleanup()
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

  it('moves a query once when it is unshared again while the first move is pending', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))

    let first: Promise<void>
    let second: Promise<void>
    act(() => {
      first = result.current.unshareQuery('shared-a')
      // The shared query is still listed until the move has removed it, so it can be picked again
      second = result.current.unshareQuery('shared-a')
    })
    expect(result.current.moving).toEqual(['shared-a'])
    await act(async () => {
      await Promise.all([first, second])
    })

    expect(storedUrls()).toEqual(['https://a'])
    expect(mocks.deleteDoc).toHaveBeenCalledTimes(1)
    expect(result.current.queries).toHaveLength(1)
    expect(result.current.queries[0].shared).toBe(false)
    expect(result.current.moving).toEqual([])
  })

  it('shares a query once when it is shared again while the first move is pending', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z', title: 'A'}],
    }
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))

    let moves: Promise<void[]>
    act(() => {
      moves = Promise.all([result.current.shareQuery('p1'), result.current.shareQuery('p1')])
    })
    expect(result.current.moving).toEqual(['p1'])
    await act(async () => {
      await moves
    })

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(storedUrls()).toEqual([])
    expect(result.current.queries.map((query) => [query._key, query.shared])).toEqual([
      ['shared-1', true],
    ])
    expect(result.current.moving).toEqual([])
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

  it('treats a store write that resolves null as failed, since that is how the store reports one', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z'}],
    }
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))

    // The key-value store logs a failed server write and resolves null instead of rejecting
    mocks.setKey.mockResolvedValueOnce(null)
    let save: Promise<string>
    act(() => {
      save = result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    await act(async () => {
      await expect(save).rejects.toThrow('could not be stored')
    })
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://a'])

    mocks.setKey.mockResolvedValueOnce(null)
    let clear: Promise<void>
    act(() => {
      clear = result.current.clearQueries()
    })
    await act(async () => {
      await expect(clear).rejects.toThrow('could not be stored')
    })
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://a'])
  })

  it('keeps a saved query when the server read from before the save resolves after it', async () => {
    const {result} = setup()

    await act(async () => {
      await result.current.saveQuery({url: 'https://a', savedAt: '2026-01-01T00:00:00Z'})
    })
    // The store only forwards its events once the initial read is done, so the save above was
    // never echoed and the read now delivers the list from before it
    act(() => {
      storeEvents.next({queries: []})
    })
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://a'])

    await act(async () => {
      await result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    expect(mocks.store.value?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('keeps the queries when clearing them fails, whatever the store emits meanwhile', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z'}],
    }
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    mocks.store.failWrite = () => true

    let clear: Promise<void>
    act(() => {
      clear = result.current.clearQueries()
      // The store announces the list a write holds before knowing whether it went through
      storeEvents.next({queries: []})
    })
    await act(async () => {
      await expect(clear).rejects.toThrow('store is read-only')
    })
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://a'])

    // The next write starts from the list the store still holds, not from the empty one
    mocks.store.failWrite = undefined
    await act(async () => {
      await result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    expect(mocks.store.value?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('keeps its list when a hidden Activity shows the tool again without a localStorage copy', async () => {
    mocks.store.value = {
      queries: [{_key: 'p1', url: 'https://a', savedAt: '2026-01-01T00:00:00Z'}],
    }
    mocks.setKey.mockImplementation(async (_key: string, next: StoredQueries) => {
      mocks.store.value = next
      return next
    })
    const latest = slot<ReturnType<typeof useSavedQueries>>()
    function Probe({onRender}: {onRender: (result: ReturnType<typeof useSavedQueries>) => void}) {
      const result = useSavedQueries()
      useEffect(() => {
        onRender(result)
      })
      return null
    }
    const harness = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Probe
          onRender={(result) => {
            latest.current = result
          }}
        />
      </Activity>
    )
    const {rerender} = render(harness('visible'))
    await waitFor(() => expect(latest.current?.queries).toHaveLength(1))

    // Hiding tears the subscription down; showing subscribes again, and this time the store has
    // no localStorage copy to start from, so it emits nothing useful until the server answers
    mocks.store.value = null
    rerender(harness('hidden'))
    rerender(harness('visible'))
    expect(latest.current?.queries.map((query) => query.url)).toEqual(['https://a'])

    // A write in that window starts from the list, not from empty
    await act(async () => {
      await latest.current?.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    expect(storedUrls()).toEqual(['https://b', 'https://a'])
    expect(latest.current?.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })
})
