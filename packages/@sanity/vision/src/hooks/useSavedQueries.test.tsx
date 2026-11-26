import {type SanityClient} from '@sanity/client'
import {act, cleanup, renderHook, waitFor} from '@testing-library/react'
import {NEVER} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type QueryConfig, useSavedQueries} from './useSavedQueries'

const mocks = vi.hoisted(() => ({
  // The personal saved queries, as the preferences API lists them
  items: [] as {itemId: string; value: QueryConfig}[],
  setItem: vi.fn(),
  sharedDocs: [] as {_id: string; authorId: string; savedAt: string; url: string; title?: string}[],
  create: vi.fn(),
  patch: vi.fn(),
  deleteDoc: vi.fn(),
}))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver', () => ({
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
  useStudioPreferenceList: () => ({items: mocks.items, error: undefined, set: mocks.setItem}),
}))

const client = {
  fetch: () => Promise.resolve(mocks.sharedDocs),
  observable: {listen: () => NEVER},
  create: mocks.create,
  patch: mocks.patch,
  delete: mocks.deleteDoc,
} as unknown as SanityClient
const currentUser = {id: 'user-1'}

vi.mock('sanity', () => ({
  useClient: () => client,
  useCurrentUser: () => currentUser,
}))

function setup() {
  let created = 0
  mocks.create.mockImplementation(async (doc: Record<string, unknown>) => {
    await wait(5)
    created += 1
    return {...doc, _id: `shared-${created}`}
  })
  mocks.patch.mockImplementation((id: string) => ({
    set: (fields: Record<string, unknown>) => ({
      commit: async () => {
        await wait(5)
        const doc = mocks.sharedDocs.find((shared) => shared._id === id)
        return {...doc, ...fields}
      },
    }),
  }))
  mocks.deleteDoc.mockImplementation(async () => {
    await wait(5)
  })
  return renderHook(() => useSavedQueries())
}

describe('useSavedQueries', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    mocks.items = []
    mocks.sharedDocs = []
  })

  it('lists the personal queries saved in the classic tool with the shared ones, newest first', async () => {
    mocks.items = [
      {itemId: 'saved-b', value: {_key: 'saved-b', url: 'https://b', savedAt: '2026-01-02'}},
    ]
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-2', savedAt: '2026-01-01', url: 'https://a'},
      {_id: 'shared-c', authorId: 'user-1', savedAt: '2026-01-03', url: 'https://c'},
    ]
    const {result} = setup()

    await waitFor(() => expect(result.current.sharedQueriesLoaded).toBe(true))
    expect(
      result.current.queries.map(({_key, shared, isOwnedByCurrentUser}) => ({
        _key,
        shared,
        isOwnedByCurrentUser,
      })),
    ).toEqual([
      {_key: 'shared-c', shared: true, isOwnedByCurrentUser: true},
      {_key: 'saved-b', shared: undefined, isOwnedByCurrentUser: undefined},
      {_key: 'shared-a', shared: true, isOwnedByCurrentUser: false},
    ])
  })

  it('shares a query as a shared query document, writing nothing to the personal queries', async () => {
    const {result} = setup()
    await waitFor(() => expect(result.current.sharedQueriesLoaded).toBe(true))

    let sharedId = ''
    await act(async () => {
      sharedId = await result.current.shareQuery({
        url: 'https://a',
        title: 'Posts',
        savedAt: '2026-01-01T00:00:00Z',
      })
    })

    expect(sharedId).toBe('shared-1')
    expect(mocks.create).toHaveBeenCalledWith({
      _type: 'vision.sharedQuery',
      authorId: 'user-1',
      savedAt: '2026-01-01T00:00:00Z',
      title: 'Posts',
      url: 'https://a',
    })
    expect(result.current.queries.map((query) => query._key)).toEqual(['shared-1'])
    expect(mocks.setItem).not.toHaveBeenCalled()
  })

  it('stays saving until the last of two overlapping shares has settled', async () => {
    const {result} = setup()
    mocks.create
      .mockImplementationOnce(async (doc: Record<string, unknown>) => {
        await wait(20)
        return {...doc, _id: 'shared-slow'}
      })
      .mockImplementationOnce(async (doc: Record<string, unknown>) => {
        await wait(5)
        return {...doc, _id: 'shared-fast'}
      })

    let slowShare: Promise<string>
    let fastShare: Promise<string>
    act(() => {
      slowShare = result.current.shareQuery({url: 'https://a', savedAt: '2026-01-01T00:00:00Z'})
      fastShare = result.current.shareQuery({url: 'https://b', savedAt: '2026-01-02T00:00:00Z'})
    })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      await fastShare
    })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      await slowShare
    })
    expect(result.current.saving).toBe(false)
    expect(result.current.queries.map((query) => query._key)).toEqual([
      'shared-fast',
      'shared-slow',
    ])
  })

  it('updates a shared query its author shared, and refuses one a teammate shared', async () => {
    mocks.sharedDocs = [
      {_id: 'shared-a', authorId: 'user-1', savedAt: '2026-01-01', url: 'https://a'},
      {_id: 'shared-b', authorId: 'user-2', savedAt: '2026-01-02', url: 'https://b'},
    ]
    const {result} = setup()
    await waitFor(() => expect(result.current.queries).toHaveLength(2))
    const [teammates, own] = result.current.queries

    await act(async () => {
      await result.current.updateSharedQuery({...own, title: 'Renamed', savedAt: '2026-01-03'})
    })
    expect(result.current.queries.find((query) => query._key === 'shared-a')?.title).toBe('Renamed')

    await act(async () => {
      await expect(
        result.current.updateSharedQuery({...teammates, title: 'Renamed'}),
      ).rejects.toThrow('Only the author can update a shared query.')
    })
    expect(mocks.patch).toHaveBeenCalledTimes(1)
    expect(result.current.saving).toBe(false)
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
    expect(mocks.setItem).not.toHaveBeenCalled()
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
