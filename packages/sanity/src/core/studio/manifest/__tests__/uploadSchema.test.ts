import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DESCRIPTOR_CONVERTER} from '../../../schema/descriptors'
import {_clearClaimPromiseCache, uploadSchema} from '../uploadSchema'

// Mock DESCRIPTOR_CONVERTER.get() to return a controlled descriptorId
vi.mock('../../../schema/descriptors', () => ({
  DESCRIPTOR_CONVERTER: {
    get: vi.fn(),
  },
}))

// Mock processSchemaSynchronization to return null (sync complete immediately)
vi.mock('@sanity/schema/_internal', () => ({
  processSchemaSynchronization: vi.fn(() => null),
}))

// Mock isDev to false so contextKey is deterministic
vi.mock('../../../environment', () => ({
  isDev: false,
}))

function createMockClient(overrides?: {projectId?: string; dataset?: string}) {
  const projectId = overrides?.projectId ?? 'proj1'
  const dataset = overrides?.dataset ?? 'production'

  return {
    config: () => ({projectId, dataset}),
    request: vi.fn().mockResolvedValue({
      expiresAt: '2099-01-01T00:00:00Z',
      synchronization: {},
    }),
  } as unknown as SanityClient & {request: ReturnType<typeof vi.fn>}
}

function mockDescriptorId(id: string) {
  vi.mocked(DESCRIPTOR_CONVERTER.get).mockResolvedValue({
    set: {id},
  } as any)
}

const mockSchema = {} as Schema

describe('uploadSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _clearClaimPromiseCache()
  })

  it('should deduplicate claim POSTs for the same schema and client config', async () => {
    mockDescriptorId('desc-1')
    const client = createMockClient()

    const [result1, result2] = await Promise.all([
      uploadSchema(mockSchema, client),
      uploadSchema(mockSchema, client),
    ])

    expect(result1).toBe('desc-1')
    expect(result2).toBe('desc-1')
    // Only one HTTP POST to /descriptors/claim should have been made
    expect(client.request).toHaveBeenCalledTimes(1)
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: '/descriptors/claim',
        method: 'POST',
      }),
    )
  })

  it('should make separate POSTs for different descriptorIds', async () => {
    const client = createMockClient()

    // First call with descriptor A
    mockDescriptorId('desc-A')
    await uploadSchema(mockSchema, client)

    // Second call with descriptor B
    mockDescriptorId('desc-B')
    await uploadSchema(mockSchema, client)

    expect(client.request).toHaveBeenCalledTimes(2)
  })

  it('should make separate POSTs for same schema but different datasets', async () => {
    mockDescriptorId('desc-1')

    const client1 = createMockClient({dataset: 'dataset-1'})
    const client2 = createMockClient({dataset: 'dataset-2'})

    await Promise.all([uploadSchema(mockSchema, client1), uploadSchema(mockSchema, client2)])

    expect(client1.request).toHaveBeenCalledTimes(1)
    expect(client2.request).toHaveBeenCalledTimes(1)
  })

  it('should evict the cache entry when the claim POST fails, allowing retry', async () => {
    mockDescriptorId('desc-1')
    const client = createMockClient()

    // First call fails
    client.request.mockRejectedValueOnce(new Error('network error'))

    await expect(uploadSchema(mockSchema, client)).rejects.toThrow('network error')

    // Second call should retry (cache was evicted on failure)
    client.request.mockResolvedValueOnce({
      expiresAt: '2099-01-01T00:00:00Z',
      synchronization: {},
    })

    const result = await uploadSchema(mockSchema, client)
    expect(result).toBe('desc-1')
    expect(client.request).toHaveBeenCalledTimes(2)
  })

  it('should return the same promise for concurrent calls with the same cache key', async () => {
    mockDescriptorId('desc-1')
    const client = createMockClient()

    // Use a deferred promise to control when the claim resolves
    let resolveRequest!: (value: unknown) => void
    client.request.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const promise1 = uploadSchema(mockSchema, client)
    const promise2 = uploadSchema(mockSchema, client)
    const promise3 = uploadSchema(mockSchema, client)

    // Resolve the single in-flight request
    resolveRequest({
      expiresAt: '2099-01-01T00:00:00Z',
      synchronization: {},
    })

    const [r1, r2, r3] = await Promise.all([promise1, promise2, promise3])

    expect(r1).toBe('desc-1')
    expect(r2).toBe('desc-1')
    expect(r3).toBe('desc-1')
    // Only one HTTP call was made despite three concurrent calls
    expect(client.request).toHaveBeenCalledTimes(1)
  })
})
