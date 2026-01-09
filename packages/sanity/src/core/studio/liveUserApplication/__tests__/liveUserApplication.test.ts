import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../config/types'
import {type UserApplicationCache} from '../../../store/userApplications'
import {findUserApplication} from '../liveUserApplication'

// Mock window.location with origin and pathname
const mockWindowLocation = (origin: string | undefined, pathname: string = '/') => {
  if (origin === undefined) {
    // Simulate server-side rendering
    vi.stubGlobal('window', undefined)
  } else {
    vi.stubGlobal('window', {
      location: {origin, pathname},
    })
  }
}

// Create a mock client for testing
const createMockClient = (projectId: string) => {
  const client = {
    withConfig: vi.fn().mockReturnThis(),
    request: vi.fn(),
    config: vi.fn().mockReturnValue({projectId}),
  }
  return client as unknown as SanityClient
}

// Mock cache factory - now takes client and extracts projectId from client.config()
const createMockCache = (
  appsByProject?: Record<
    string,
    Array<{id: string; urlType: string; appHost: string; type?: string; projectId?: string}>
  >,
): UserApplicationCache => {
  return {
    get: vi.fn((client: SanityClient) => {
      const {projectId} = client.config()
      return Promise.resolve(
        (appsByProject?.[projectId ?? ''] || []).map((app) => ({
          ...app,
          type: app.type || 'studio',
          projectId: app.projectId || projectId,
        })),
      )
    }),
  }
}

// Mock workspace factory
const createWorkspaces = (
  projects: Array<{projectId: string; authenticated?: boolean; apiHost?: string}>,
): WorkspaceSummary[] => {
  return projects.map((p) => ({
    projectId: p.projectId,
    apiHost: p.apiHost,
    auth: {
      state: of({
        authenticated: p.authenticated !== false,
        client: createMockClient(p.projectId),
      }),
    },
  })) as unknown as WorkspaceSummary[]
}

// Helper to create workspaces from just project IDs (for simpler tests)
const createWorkspacesFromIds = (projectIds: string[]): WorkspaceSummary[] => {
  return createWorkspaces(projectIds.map((projectId) => ({projectId})))
}

describe('findUserApplication', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('when window is not available (SSR)', () => {
    it('returns undefined when window is undefined', async () => {
      mockWindowLocation(undefined)

      const cache = createMockCache()
      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
      expect(cache.get).not.toHaveBeenCalled()
    })
  })

  describe('internal URLs in production', () => {
    it('matches internal URL when origin matches sanity.studio domain', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-123', urlType: 'internal', appHost: 'my-studio'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-123')
    })

    it('does not match internal URL when origin differs', async () => {
      mockWindowLocation('https://other-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-123', urlType: 'internal', appHost: 'my-studio'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })
  })

  describe('internal URLs in staging', () => {
    it('matches internal URL when origin matches studio.sanity.work domain', async () => {
      mockWindowLocation('https://my-studio.studio.sanity.work')

      const cache = createMockCache({
        proj1: [{id: 'app-456', urlType: 'internal', appHost: 'my-studio'}],
      })

      const result = await findUserApplication(
        cache,
        createWorkspaces([{projectId: 'proj1', apiHost: 'https://api.sanity.work'}]),
      )

      expect(result?.id).toBe('app-456')
    })

    it('does not match production domain when workspace has staging apiHost', async () => {
      // Window is at production URL
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-456', urlType: 'internal', appHost: 'my-studio'}],
      })

      // Workspace has staging apiHost, so app URL will be studio.sanity.work
      const result = await findUserApplication(
        cache,
        createWorkspaces([{projectId: 'proj1', apiHost: 'https://api.sanity.work'}]),
      )

      // Won't match because staging URL != production URL
      expect(result).toBeUndefined()
    })

    it('does not match staging domain when workspace has production apiHost', async () => {
      // Window is at staging URL
      mockWindowLocation('https://my-studio.studio.sanity.work')

      const cache = createMockCache({
        proj1: [{id: 'app-456', urlType: 'internal', appHost: 'my-studio'}],
      })

      // Workspace has no apiHost (defaults to production)
      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      // Won't match because production URL != staging URL
      expect(result).toBeUndefined()
    })
  })

  describe('external URLs', () => {
    it('matches external URL with exact origin', async () => {
      mockWindowLocation('https://cms.co', '/')

      const cache = createMockCache({
        proj1: [{id: 'app-external', urlType: 'external', appHost: 'https://cms.co'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-external')
    })

    it('matches external URL when user is at a subpath of the app', async () => {
      mockWindowLocation('https://cms.co', '/ui/documents')

      const cache = createMockCache({
        proj1: [{id: 'app-with-path', urlType: 'external', appHost: 'https://cms.co/ui'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-with-path')
    })

    it('does not match external URL with base path when user is at different path', async () => {
      mockWindowLocation('https://cms.co', '/other')

      const cache = createMockCache({
        proj1: [{id: 'app-with-path', urlType: 'external', appHost: 'https://cms.co/ui'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })

    it('matches localhost external URL', async () => {
      mockWindowLocation('http://localhost', '/')

      const cache = createMockCache({
        proj1: [{id: 'app-localhost', urlType: 'external', appHost: 'http://localhost'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-localhost')
    })

    it('matches localhost with port', async () => {
      mockWindowLocation('http://localhost:3000', '/')

      const cache = createMockCache({
        proj1: [{id: 'app-localhost-port', urlType: 'external', appHost: 'http://localhost:3000'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-localhost-port')
    })

    it('does not match external URL when origin differs', async () => {
      mockWindowLocation('https://other.co', '/')

      const cache = createMockCache({
        proj1: [{id: 'app-external', urlType: 'external', appHost: 'https://cms.co'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })
  })

  describe('first workspace behavior', () => {
    it('only checks the first workspace when multiple workspaces exist', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-proj1', urlType: 'internal', appHost: 'other-studio'}],
        proj2: [{id: 'app-proj2', urlType: 'internal', appHost: 'my-studio'}],
      })

      // Even though proj2 has a matching app, only proj1 (first workspace) is checked
      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1', 'proj2']))

      // Returns undefined because the first workspace (proj1) doesn't have a matching app
      expect(result).toBeUndefined()
      // Only the first workspace's project is fetched
      expect(cache.get).toHaveBeenCalledTimes(1)
    })

    it('returns match when first workspace has matching app', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-proj1', urlType: 'internal', appHost: 'my-studio'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-proj1')
      expect(cache.get).toHaveBeenCalledTimes(1)
    })

    it('passes client to cache.get when workspace is authenticated', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-proj1', urlType: 'internal', appHost: 'my-studio'}],
      })

      await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(cache.get).toHaveBeenCalledTimes(1)
      // cache.get now receives only the client
      expect(cache.get).toHaveBeenCalledWith(expect.any(Object))
    })

    it('does not call cache.get for unauthenticated workspaces', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [{id: 'app-proj1', urlType: 'internal', appHost: 'my-studio'}],
      })

      // Create workspace with authenticated: false
      await findUserApplication(
        cache,
        createWorkspaces([{projectId: 'proj1', authenticated: false}]),
      )

      expect(cache.get).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    // Note: The UserApplicationCache catches errors internally and returns []
    // These tests verify the behavior when the cache returns empty results

    it('returns undefined when cache returns empty for the first workspace', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      // Simulate cache behavior when underlying fetch fails (returns empty array)
      const cache: UserApplicationCache = {
        get: vi.fn().mockResolvedValue([]),
      }

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })

    it('returns undefined when first workspace has no matching apps even if others do', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      // Only the first workspace is checked, so even though proj2 has matching apps,
      // if proj1 is empty, the result is undefined
      const cache: UserApplicationCache = {
        get: vi.fn((client: SanityClient) => {
          const {projectId} = client.config()
          if (projectId === 'proj1') {
            return Promise.resolve([]) // First workspace has no apps
          }
          if (projectId === 'proj2') {
            return Promise.resolve([
              {id: 'app-proj2', urlType: 'internal' as const, appHost: 'my-studio', type: 'studio'},
            ])
          }
          return Promise.resolve([])
        }),
      }

      // Only first workspace (proj1) is checked
      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1', 'proj2']))

      expect(result).toBeUndefined()
    })
  })

  describe('no matching app found', () => {
    it('returns undefined when no apps exist', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })

    it('returns undefined when no apps match origin', async () => {
      mockWindowLocation('https://my-studio.sanity.studio')

      const cache = createMockCache({
        proj1: [
          {id: 'app-1', urlType: 'internal', appHost: 'other-studio'},
          {id: 'app-2', urlType: 'external', appHost: 'https://external.com'},
        ],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })
  })

  describe('longest match consideration', () => {
    it('returns the app with the longest matching appHost when multiple apps match', async () => {
      // User is at /ui/admin/settings, multiple apps could match
      mockWindowLocation('https://cms.co', '/ui/admin/settings')

      const cache = createMockCache({
        proj1: [
          {id: 'app-short', urlType: 'external', appHost: 'https://cms.co'},
          {id: 'app-medium', urlType: 'external', appHost: 'https://cms.co/ui'},
          {id: 'app-long', urlType: 'external', appHost: 'https://cms.co/ui/admin'},
        ],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      // The longest match should win
      expect(result?.id).toBe('app-long')
    })

    it('only considers apps from first workspace for longest match', async () => {
      mockWindowLocation('https://cms.co', '/admin/settings')

      const cache = createMockCache({
        proj1: [{id: 'app-short', urlType: 'external', appHost: 'https://cms.co'}],
        proj2: [{id: 'app-long', urlType: 'external', appHost: 'https://cms.co/admin'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1', 'proj2']))

      // Only first workspace (proj1) is checked, so app-short is returned
      expect(result?.id).toBe('app-short')
    })
  })

  describe('edge cases', () => {
    it('returns undefined when workspaces array is empty', async () => {
      mockWindowLocation('https://my-studio.sanity.studio', '/')

      const cache = createMockCache()

      const result = await findUserApplication(cache, [])

      expect(result).toBeUndefined()
    })

    it('should not match when origin is a prefix of appHost but not the same domain', async () => {
      // Ensures location "https://cms.co/" does not match appHost "https://cms.com"
      mockWindowLocation('https://cms.co', '/')

      const cache = createMockCache({
        proj1: [{id: 'app-wrong', urlType: 'external', appHost: 'https://cms.com'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })

    it('should match when user is at a subpath of appHost', async () => {
      // User at "https://cms.co/admin/settings" should match appHost "https://cms.co/admin"
      mockWindowLocation('https://cms.co', '/admin/settings')

      const cache = createMockCache({
        proj1: [{id: 'app-with-path', urlType: 'external', appHost: 'https://cms.co/admin'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result?.id).toBe('app-with-path')
    })

    it('should not match when user is at a different path than appHost', async () => {
      // User at "https://cms.co/other" should NOT match appHost "https://cms.co/admin"
      mockWindowLocation('https://cms.co', '/other')

      const cache = createMockCache({
        proj1: [{id: 'app-with-path', urlType: 'external', appHost: 'https://cms.co/admin'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })

    it('does not match partial path segments', async () => {
      mockWindowLocation('https://cms.co', '/administrator')

      const cache = createMockCache({
        proj1: [{id: 'app-admin', urlType: 'external', appHost: 'https://cms.co/admin'}],
      })

      const result = await findUserApplication(cache, createWorkspacesFromIds(['proj1']))

      expect(result).toBeUndefined()
    })
  })
})
