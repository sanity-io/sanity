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
    VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
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

  function setup(options?: Parameters<typeof useSavedQueries>[0]) {
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
    return renderHook(() => useSavedQueries(options))
  }

  it('reports each personal query a save creates before writing it', async () => {
    const created: string[] = []
    const {result} = setup({
      onCreatePersonalQuery: (key) => {
        // Not written yet, so the list cannot show it
        expect(mocks.items.has(key)).toBe(false)
        created.push(key)
      },
    })
    await waitFor(() => expect(result.current.sharedQueriesLoaded).toBe(true))

    let savedKey = ''
    await act(async () => {
      savedKey = await result.current.saveQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
      await result.current.saveQuery({
        shared: true,
        url: 'https://c',
        savedAt: '2026-01-03T00:00:00Z',
      })
    })

    expect(created).toEqual([savedKey])
    expect([...mocks.items.keys()]).toEqual([savedKey])
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

  it('reports the shared queries as loaded once they have been fetched', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-2', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    expect(result.current.sharedQueriesLoaded).toBe(false)

    await waitFor(() => expect(result.current.sharedQueriesLoaded).toBe(true))
    expect(result.current.queries.map((query) => query._key)).toEqual(['shared-a'])
  })

  it('unshares a shared query by deleting it, without saving a personal copy', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))

    await act(async () => {
      await result.current.unshareQuery('shared-a')
    })

    expect(mocks.deleteDoc).toHaveBeenCalledWith('shared-a')
    expect(mocks.create).not.toHaveBeenCalled()
    expect(storedUrls()).toEqual([])
    expect(result.current.queries).toEqual([])
  })

  it('refuses to unshare a query a teammate shared', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-2', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))

    await act(async () => {
      await expect(result.current.unshareQuery('shared-a')).rejects.toThrow(
        'Only the author can unshare a shared query.',
      )
    })

    expect(mocks.deleteDoc).not.toHaveBeenCalled()
    expect(result.current.queries.map((query) => query._key)).toEqual(['shared-a'])
  })

  it('rejects and keeps the shared query when deleting it fails', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01T00:00:00Z', url: 'https://a'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(1))
    mocks.deleteDoc.mockRejectedValueOnce(new Error('permission denied'))

    await act(async () => {
      await expect(result.current.unshareQuery('shared-a')).rejects.toThrow('permission denied')
    })

    expect(result.current.queries.map((query) => query._key)).toEqual(['shared-a'])
  })
})
