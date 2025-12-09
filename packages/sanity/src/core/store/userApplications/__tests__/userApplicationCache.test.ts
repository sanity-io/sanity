import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createUserApplicationCache, type UserApplication} from '../userApplicationCache'

const TOGGLE = 'toggle.user-application.upload-live-manifest'

// Mock getFeatures to return the toggle by default
vi.mock('../../../hooks/useFeatureEnabled', () => ({
  getFeatures: vi.fn(() => of([TOGGLE])),
}))

describe('userApplicationCache', () => {
  const mockRequest = vi.fn()
  const mockWithConfig = vi.fn()
  const mockConfig = vi.fn()

  const mockClient = {
    withConfig: mockWithConfig,
  } as unknown as SanityClient

  const mockConfiguredClient = {
    request: mockRequest,
    config: mockConfig,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWithConfig.mockReturnValue(mockConfiguredClient)
    // Default config returns the projectId that was configured
    mockConfig.mockReturnValue({projectId: 'proj-123'})
  })

  describe('createUserApplicationCache', () => {
    it('should return an object with get method', () => {
      const cache = createUserApplicationCache(mockClient)

      expect(cache).toHaveProperty('get')
      expect(typeof cache.get).toBe('function')
    })
  })

  describe('get', () => {
    // API response type (without apiHost, which is added by the cache)
    type ApiUserApplication = Omit<UserApplication, 'apiHost'>

    const mockApps: ApiUserApplication[] = [
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

    it('should configure client with projectId and fetch apps from API', async () => {
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache(mockClient)
      const result = await cache.get('proj-123')

      expect(mockWithConfig).toHaveBeenCalledWith({
        projectId: 'proj-123',
        apiHost: 'https://api.sanity.io',
      })
      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/projects/proj-123/user-applications',
        tag: 'user-application-cache.fetch-user-applications',
      })
      expect(result).toEqual(mockApps.map((app) => ({...app, apiHost: 'https://api.sanity.io'})))
    })

    it('should configure client with projectId and apiHost when provided', async () => {
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache(mockClient)
      await cache.get('proj-123', 'https://api.example.com')

      expect(mockWithConfig).toHaveBeenCalledWith({
        projectId: 'proj-123',
        apiHost: 'https://api.example.com',
      })
    })

    it('should cache results and return cached on subsequent calls', async () => {
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache(mockClient)
      const expectedApps = mockApps.map((app) => ({...app, apiHost: 'https://api.sanity.io'}))

      // First call - should fetch from API
      const result1 = await cache.get('proj-123')
      expect(result1).toEqual(expectedApps)
      expect(mockRequest).toHaveBeenCalledTimes(1)

      // Second call - should return cached result
      const result2 = await cache.get('proj-123')
      expect(result2).toEqual(expectedApps)
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

      const cache = createUserApplicationCache(mockClient)

      const [result1, result2] = await Promise.all([cache.get('proj-123'), cache.get('proj-123')])

      // Both concurrent requests return apps with apiHost
      const expectedApps = mockApps.map((app) => ({...app, apiHost: 'https://api.sanity.io'}))
      expect(result1).toEqual(expectedApps)
      expect(result2).toEqual(expectedApps)
    })

    it('should return empty array and clear cache on API failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'))

      const cache = createUserApplicationCache(mockClient)
      const result = await cache.get('proj-123')

      expect(result).toEqual([])

      // Cache should be cleared, so next call should retry
      mockRequest.mockResolvedValueOnce(mockApps)
      const result2 = await cache.get('proj-123')
      expect(result2).toEqual(mockApps.map((app) => ({...app, apiHost: 'https://api.sanity.io'})))
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should handle empty project (no apps)', async () => {
      mockRequest.mockResolvedValueOnce([])

      const cache = createUserApplicationCache(mockClient)
      const result = await cache.get('proj-empty')

      expect(result).toEqual([])

      // Second call should also return empty array from cache
      const result2 = await cache.get('proj-empty')
      expect(result2).toEqual([])
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should cache different projects independently', async () => {
      const appsProject1: ApiUserApplication[] = [
        {id: 'app-p1', type: 'studio', projectId: 'proj-1', urlType: 'internal', appHost: 'p1'},
      ]
      const appsProject2: ApiUserApplication[] = [
        {id: 'app-p2', type: 'studio', projectId: 'proj-2', urlType: 'internal', appHost: 'p2'},
      ]

      mockRequest.mockResolvedValueOnce(appsProject1).mockResolvedValueOnce(appsProject2)

      const cache = createUserApplicationCache(mockClient)

      const expectedApps1 = appsProject1.map((app) => ({...app, apiHost: 'https://api.sanity.io'}))
      const expectedApps2 = appsProject2.map((app) => ({...app, apiHost: 'https://api.sanity.io'}))

      // First calls - each project fetches from API
      const result1 = await cache.get('proj-1')
      const result2 = await cache.get('proj-2')

      expect(result1).toEqual(expectedApps1)
      expect(result2).toEqual(expectedApps2)
      expect(mockRequest).toHaveBeenCalledTimes(2)

      // Both projects should be cached
      const result1Again = await cache.get('proj-1')
      const result2Again = await cache.get('proj-2')
      expect(result1Again).toEqual(expectedApps1)
      expect(result2Again).toEqual(expectedApps2)
      expect(mockRequest).toHaveBeenCalledTimes(2) // No additional calls
    })

    it('should store apiHost on cached apps for subsequent calls', async () => {
      const appsFromApi: ApiUserApplication[] = [
        {id: 'app-1', type: 'studio', urlType: 'internal', appHost: 'studio-1'},
      ]
      mockRequest.mockResolvedValueOnce(appsFromApi)

      const cache = createUserApplicationCache(mockClient)

      // First call returns original apps from API
      await cache.get('proj-123', 'https://api.example.com')

      // Second call returns cached apps with apiHost added
      const result = await cache.get('proj-123')

      expect(result[0]).toEqual({
        ...appsFromApi[0],
        apiHost: 'https://api.example.com',
      })
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('feature toggle', () => {
    it('should return empty array when feature toggle is disabled', async () => {
      const {getFeatures} = await import('../../../hooks/useFeatureEnabled')
      vi.mocked(getFeatures).mockReturnValueOnce(of([]))

      const cache = createUserApplicationCache(mockClient)
      const result = await cache.get('proj-123')

      expect(result).toEqual([])
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('should fetch apps when feature toggle is enabled', async () => {
      const {getFeatures} = await import('../../../hooks/useFeatureEnabled')
      vi.mocked(getFeatures).mockReturnValueOnce(of([TOGGLE]))

      const mockApps = [{id: 'app-1', type: 'studio', urlType: 'internal', appHost: 'studio-1'}]
      mockRequest.mockResolvedValueOnce(mockApps)

      const cache = createUserApplicationCache(mockClient)
      const result = await cache.get('proj-123')

      expect(result).toEqual(mockApps.map((app) => ({...app, apiHost: 'https://api.sanity.io'})))
      expect(mockRequest).toHaveBeenCalled()
    })
  })
})
