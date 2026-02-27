import {type SanityClient} from '@sanity/client'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {createUserApplicationCache, type UserApplication} from '../userApplicationCache'

describe('userApplicationCache', () => {
  const mockRequest = vi.fn()
  const mockWithConfig = vi.fn()
  const mockConfig = vi.fn()

  const mockConfiguredClient = {
    request: mockRequest,
    config: mockConfig,
  }

  // Helper to create a mock client with a specific projectId
  const createMockClient = (projectId: string) =>
    ({
      withConfig: mockWithConfig,
      config: vi.fn().mockReturnValue({projectId}),
    }) as unknown as SanityClient

  // Default mock client for most tests
  let mockClient: SanityClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockWithConfig.mockReturnValue(mockConfiguredClient)
    // Default config returns the projectId that was configured
    mockConfig.mockReturnValue({projectId: 'proj-123'})
    // Create default client with proj-123
    mockClient = createMockClient('proj-123')
  })

  describe('createUserApplicationCache', () => {
    it('should return an object with get method', () => {
      const cache = createUserApplicationCache()

      expect(cache).toHaveProperty('get')
      expect(typeof cache.get).toBe('function')
    })
  })

  describe('get', () => {
    const mockApps: UserApplication[] = [
      {
        id: 'app-1',
        type: 'studio',
        projectId: 'proj-123',
        urlType: 'internal',
        appHost: 'studio-1',
      },
      {
        id: 'app-2',
        type: 'studio',
        projectId: 'proj-123',
        urlType: 'external',
        appHost: 'https://my-studio.example.com',
      },
    ]

    it('should configure client with DEFAULT_STUDIO_CLIENT_OPTIONS and fetch apps from API', async () => {
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache()
      const result = await cache.get(mockClient)

      expect(mockWithConfig).toHaveBeenCalledWith(DEFAULT_STUDIO_CLIENT_OPTIONS)
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/projects/proj-123/user-applications',
        tag: 'user-application-cache.fetch-user-applications',
      })
      expect(result).toEqual(mockApps)
    })

    it('should cache results and return cached on subsequent calls', async () => {
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache()

      // First call - should fetch from API
      const result1 = await cache.get(mockClient)
      expect(result1).toEqual(mockApps)
      expect(mockRequest).toHaveBeenCalledTimes(1)

      // Second call - should return cached result
      const result2 = await cache.get(mockClient)
      expect(result2).toEqual(mockApps)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent requests for the same project ID', async () => {
      // Both concurrent requests may make API calls due to async isEnabled check
      mockRequest.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockApps), 50)
          }),
      )

      const cache = createUserApplicationCache()

      const [result1, result2] = await Promise.all([cache.get(mockClient), cache.get(mockClient)])

      expect(result1).toEqual(mockApps)
      expect(result2).toEqual(mockApps)
    })

    it('should return empty array and clear cache on API failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'))

      const cache = createUserApplicationCache()
      const result = await cache.get(mockClient)

      expect(result).toEqual([])

      // Cache should be cleared, so next call should retry
      mockRequest.mockResolvedValueOnce(mockApps)
      const result2 = await cache.get(mockClient)
      expect(result2).toEqual(mockApps)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should handle empty project (no apps)', async () => {
      mockRequest.mockResolvedValueOnce([])

      const emptyClient = createMockClient('proj-empty')
      const cache = createUserApplicationCache()
      const result = await cache.get(emptyClient)

      expect(result).toEqual([])

      // Second call should also return empty array from cache
      const result2 = await cache.get(emptyClient)
      expect(result2).toEqual([])
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should cache different projects independently', async () => {
      const appsProject1: UserApplication[] = [
        {id: 'app-p1', type: 'studio', projectId: 'proj-1', urlType: 'internal', appHost: 'p1'},
      ]
      const appsProject2: UserApplication[] = [
        {id: 'app-p2', type: 'studio', projectId: 'proj-2', urlType: 'internal', appHost: 'p2'},
      ]

      mockRequest.mockResolvedValueOnce(appsProject1).mockResolvedValueOnce(appsProject2)

      const cache = createUserApplicationCache()
      const client1 = createMockClient('proj-1')
      const client2 = createMockClient('proj-2')

      // First calls - each project fetches from API
      const result1 = await cache.get(client1)
      const result2 = await cache.get(client2)

      expect(result1).toEqual(appsProject1)
      expect(result2).toEqual(appsProject2)
      expect(mockRequest).toHaveBeenCalledTimes(2)

      // Both projects should be cached
      const result1Again = await cache.get(client1)
      const result2Again = await cache.get(client2)
      expect(result1Again).toEqual(appsProject1)
      expect(result2Again).toEqual(appsProject2)
      expect(mockRequest).toHaveBeenCalledTimes(2) // No additional calls
    })
  })
})
