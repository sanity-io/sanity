import {type SanityClient} from '@sanity/client'
import {act, cleanup, renderHook, waitFor} from '@testing-library/react'
import {NEVER} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type QueryConfig, useSavedQueries} from './useSavedQueries'

const mocks = vi.hoisted(() => ({
  // The user's saved query items, by item ID
  items: new Map<string, QueryConfig>(),
  failRemove: false,
  listeners: new Set<() => void>(),
  sharedDocs: [] as {_id: string; authorId: string; savedAt: string; url: string; title?: string}[],
  create: vi.fn(),
  deleteDoc: vi.fn(),
}))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Like the preferences API: one request per item, slow enough for calls to overlap
let snapshot: {itemId: string; value: QueryConfig}[] = []
async function setItem(itemId: string, value: QueryConfig | undefined) {
  await wait(10)
  if (value === undefined) {
    if (mocks.failRemove) throw new Error('store is read-only')
    mocks.items.delete(itemId)
  } else {
    mocks.items.set(itemId, value)
  }
  publish()
}
function publish() {
  snapshot = [...mocks.items].map(([itemId, value]) => ({itemId, value}))
  for (const listener of mocks.listeners) listener()
}
function subscribe(listener: () => void) {
  mocks.listeners.add(listener)
  return () => mocks.listeners.delete(listener)
}

vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver', async () => {
  const {useSyncExternalStore} = await import('react')
  return {
    useStudioPreferenceList: () => ({
      items: useSyncExternalStore(subscribe, () => snapshot),
      error: undefined,
      set: setItem,
    }),
  }
})

const client = {
  fetch: () => Promise.resolve(mocks.sharedDocs),
  observable: {listen: () => NEVER},
  create: mocks.create,
  delete: mocks.deleteDoc,
} as unknown as SanityClient
const currentUser = {id: 'user-1'}

vi.mock('sanity', () => ({
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
  useClient: () => client,
  useCurrentUser: () => currentUser,
}))

const storedUrls = () => [...mocks.items.values()].map((query) => query.url)

describe('useSavedQueries', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    mocks.items.clear()
    mocks.failRemove = false
    mocks.sharedDocs = []
    snapshot = []
  })

  function setup() {
    publish()
    let created = 0
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

    expect(storedUrls().toSorted()).toEqual(['https://a', 'https://b'])
    expect(result.current.queries.map((query) => query.url)).toEqual(['https://b', 'https://a'])
  })

  it('stays saving until the last of two overlapping saves has settled', async () => {
    const {result} = setup()

    // The shared save settles first (its write is the faster mock), the personal one later
    let sharedSave: Promise<string>
    let personalSave: Promise<string>
    act(() => {
      sharedSave = result.current.saveQuery({
        shared: true,
        url: 'https://a',
        savedAt: '2026-01-01T00:00:00Z',
      })
      personalSave = result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      await sharedSave
    })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      await personalSave
    })
    expect(result.current.saving).toBe(false)
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

    expect(storedUrls().toSorted()).toEqual(['https://a', 'https://b'])
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
    mocks.items.set('p1', {
      _key: 'p1',
      url: 'https://a',
      savedAt: '2026-01-01T00:00:00Z',
      title: 'A',
    })
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

  it('keeps the copy a move makes moving too, so a move of it joins the pending one', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    // The move stays pending at its last step until released
    let releaseDelete = () => {}
    mocks.deleteDoc.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseDelete = resolve
        }),
    )

    let unshare: Promise<void>
    act(() => {
      unshare = result.current.unshareQuery('shared-a')
    })
    // The personal copy is in the list, and moving, while the shared original is still there
    await waitFor(() => expect(result.current.moving).toHaveLength(2))
    const copy = result.current.queries.find((query) => !query.shared)
    if (!copy) throw new Error('expected the personal copy')
    expect(result.current.queries).toHaveLength(2)
    expect(result.current.moving).toEqual(['shared-a', copy._key])

    // Sharing that copy right away is the pending unshare, not a new move
    let share: Promise<void>
    act(() => {
      share = result.current.shareQuery(copy._key)
    })
    releaseDelete()
    await act(async () => {
      await Promise.all([unshare, share])
    })

    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.deleteDoc).toHaveBeenCalledTimes(1)
    expect(result.current.queries.map((query) => [query._key, query.shared])).toEqual([
      [copy._key, false],
    ])
    expect(result.current.moving).toEqual([])
  })

  it('takes a shared copy back when the personal one cannot be removed', async () => {
    mocks.items.set('p1', {
      _key: 'p1',
      url: 'https://a',
      savedAt: '2026-01-01T00:00:00Z',
      title: 'A',
    })
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    // Only the removal fails; adding queries keeps working
    mocks.failRemove = true

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
    expect(storedUrls()).toEqual(['https://a'])
  })
})
