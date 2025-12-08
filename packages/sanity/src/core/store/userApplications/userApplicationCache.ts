import {type SanityClient} from '@sanity/client'

/**
 * User application from the API
 * @internal
 */
export interface UserApplication {
  id: string
  type: string
  projectId?: string
  organizationId?: string
  title?: string
  urlType: 'internal' | 'external'
  appHost: string
  apiHost: string
}

/**
 * Cache for user applications fetched from the API.
 * Caches by projectId to avoid duplicate fetches.
 * @internal
 */
export interface UserApplicationCache {
  /**
   * Get user applications for a project.
   * Returns cached results if available, otherwise fetches from API.
   */
  get: (projectId: string, apiHost?: string) => Promise<UserApplication[]>
}

/**
 * Creates a cache for user applications.
 * Uses a single cache keyed by app ID, with a separate index for project lookups.
 * @internal
 */
export function createUserApplicationCache(client: SanityClient): UserApplicationCache {
  // Main cache storing apps by ID
  const appCache: Record<string, Promise<UserApplication> | UserApplication> = {}
  // Index mapping projectId -> app IDs (or a promise while fetching)
  const projectIndex: Record<string, Promise<string[]> | string[]> = {}

  return {
    get: async (projectId, apiHost) => {
      const existingIndex = projectIndex[projectId]
      if (existingIndex) {
        // If we have the index, resolve apps from the main cache
        const appIds = await existingIndex
        return Promise.all(appIds.map((id) => appCache[id])) as Promise<UserApplication[]>
      }

      const targetHost = typeof apiHost === 'undefined' ? 'https://api.sanity.io' : apiHost

      const promise = client
        .withConfig({
          projectId,
          apiHost: targetHost,
        })
        .request<UserApplication[]>({
          method: 'GET',
          url: `/projects/${projectId}/user-applications`,
          tag: 'user-application-cache.fetch-user-applications',
        })
        .then((apps: UserApplication[]) => {
          // Store each app in the main cache with apiHost and collect IDs
          const appsWithApiHost = apps.map((app) => {
            const appWithApiHost = {...app, apiHost: targetHost}
            appCache[app.id] = appWithApiHost
            return appWithApiHost
          })
          // Replace promise with resolved IDs
          projectIndex[projectId] = appsWithApiHost.map((app) => app.id)
          return appsWithApiHost
        })
        .catch(() => {
          // Clear index entry on error so it can be retried
          delete projectIndex[projectId]
          return []
        })

      // Store a promise that resolves to the app IDs
      projectIndex[projectId] = promise.then((apps) => apps.map((app) => app.id))
      return promise
    },
  }
}
