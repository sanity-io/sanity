import {createClient, type SanityClient} from '@sanity/client'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {enqueueAssetAccessPolicyFetch} from './fetch'
import {makeMediaLibraryRef} from './refs'

const librarySeq = {n: 0}

function nextLibraryId() {
  librarySeq.n += 1
  return `library-${librarySeq.n}`
}

function attachFetch(client: SanityClient, fetchImpl: SanityClient['fetch']): SanityClient {
  client.fetch = fetchImpl
  const withConfig = client.withConfig.bind(client)
  client.withConfig = (config) => attachFetch(withConfig(config), fetchImpl)
  return client
}

function createTestClient(fetchImpl: SanityClient['fetch']) {
  return attachFetch(
    createClient({
      projectId: 'abc123',
      dataset: 'production',
      apiVersion: '2025-02-19',
      useCdn: false,
    }),
    fetchImpl,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('enqueueAssetAccessPolicyFetch', () => {
  test('resolves undefined when the client is omitted', async () => {
    await expect(
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef(nextLibraryId(), 'asset-1')),
    ).resolves.toBeUndefined()
  })

  test('resolves undefined when the library id is empty', async () => {
    const fetch = vi.fn()

    await expect(
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef('', 'asset-1'), createTestClient(fetch)),
    ).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('resolves undefined when the asset id is empty', async () => {
    const fetch = vi.fn()

    await expect(
      enqueueAssetAccessPolicyFetch(
        makeMediaLibraryRef(nextLibraryId(), ''),
        createTestClient(fetch),
      ),
    ).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('fetches the policy on a cache miss and returns the cdnAccessPolicy', async () => {
    const fetch = vi.fn().mockResolvedValue([{_id: 'asset-1', cdnAccessPolicy: 'private'}])
    const libraryId = nextLibraryId()

    await expect(
      enqueueAssetAccessPolicyFetch(
        makeMediaLibraryRef(libraryId, 'asset-1'),
        createTestClient(fetch),
      ),
    ).resolves.toBe('private')

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('*[_id in $ids]{_id, cdnAccessPolicy}', {ids: ['asset-1']})
  })

  test('returns a cached policy without fetching again', async () => {
    const fetch = vi.fn().mockResolvedValue([{_id: 'asset-1', cdnAccessPolicy: 'public'}])
    const client = createTestClient(fetch)
    const ref = makeMediaLibraryRef(nextLibraryId(), 'asset-1')

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBe('public')
    fetch.mockClear()

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBe('public')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('batches two refs from the same library into one request', async () => {
    const fetch = vi.fn().mockImplementation((_query: string, params: {ids: string[]}) =>
      Promise.resolve(
        params.ids.map((id) => ({
          _id: id,
          cdnAccessPolicy: id === 'asset-a' ? 'public' : 'private',
        })),
      ),
    )
    const client = createTestClient(fetch)
    const libraryId = nextLibraryId()

    const [policyA, policyB] = await Promise.all([
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef(libraryId, 'asset-a'), client),
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef(libraryId, 'asset-b'), client),
    ])

    expect(policyA).toBe('public')
    expect(policyB).toBe('private')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('*[_id in $ids]{_id, cdnAccessPolicy}', {
      ids: ['asset-a', 'asset-b'],
    })
  })

  test('keeps fetches for different libraries on separate requests', async () => {
    const fetch = vi
      .fn()
      .mockImplementation((_query: string, params: {ids: string[]}) =>
        Promise.resolve(params.ids.map((id) => ({_id: id, cdnAccessPolicy: 'public'}))),
      )
    const client = createTestClient(fetch)

    const [first, second] = await Promise.all([
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef(nextLibraryId(), 'asset-1'), client),
      enqueueAssetAccessPolicyFetch(makeMediaLibraryRef(nextLibraryId(), 'asset-1'), client),
    ])

    expect(first).toBe('public')
    expect(second).toBe('public')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('maps a missing document to undefined and caches that result', async () => {
    const fetch = vi.fn().mockResolvedValue([])
    const client = createTestClient(fetch)
    const ref = makeMediaLibraryRef(nextLibraryId(), 'missing-asset')

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBeUndefined()
    fetch.mockClear()

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('maps a document without cdnAccessPolicy to undefined', async () => {
    const fetch = vi.fn().mockResolvedValue([{_id: 'asset-1'}])
    const libraryId = nextLibraryId()

    await expect(
      enqueueAssetAccessPolicyFetch(
        makeMediaLibraryRef(libraryId, 'asset-1'),
        createTestClient(fetch),
      ),
    ).resolves.toBeUndefined()
  })

  test('returns undefined and caches the miss when the batch fetch rejects', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const client = createTestClient(fetch)
    const ref = makeMediaLibraryRef(nextLibraryId(), 'asset-1')

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
    fetch.mockClear()

    await expect(enqueueAssetAccessPolicyFetch(ref, client)).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  test('reuses the first client that created a loader for a library', async () => {
    const fetchA = vi
      .fn()
      .mockImplementation((_query: string, params: {ids: string[]}) =>
        Promise.resolve(params.ids.map((id) => ({_id: id, cdnAccessPolicy: 'public'}))),
      )
    const fetchB = vi.fn().mockResolvedValue([{_id: 'asset-2', cdnAccessPolicy: 'private'}])
    const libraryId = nextLibraryId()

    await expect(
      enqueueAssetAccessPolicyFetch(
        makeMediaLibraryRef(libraryId, 'asset-1'),
        createTestClient(fetchA),
      ),
    ).resolves.toBe('public')
    await expect(
      enqueueAssetAccessPolicyFetch(
        makeMediaLibraryRef(libraryId, 'asset-2'),
        createTestClient(fetchB),
      ),
    ).resolves.toBe('public')

    expect(fetchB).not.toHaveBeenCalled()
    expect(fetchA).toHaveBeenCalledTimes(2)
  })
})
