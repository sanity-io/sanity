import {type SanityClient} from '@sanity/client'
import debugit from 'debug'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'

const debug = debugit('sanity:store')

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
  get: (client: SanityClient) => Promise<UserApplication[]>
}

/**
 * Creates a cache for user applications.
 * Uses a single cache keyed by app ID, with a separate index for project lookups.
 * @internal
 */
export function createUserApplicationCache(): UserApplicationCache {
  // This cache uses the pattern of storing Promise | Value to deduplicate
  // concurrent requests. The promise is stored immediately to prevent duplicate
  // fetches, then replaced with the resolved value for efficiency.
  const appCache: Record<string, Promise<UserApplication> | UserApplication> = {}
  const projectIndex: Record<string, Promise<string[]> | string[]> = {}

  return {
    get: async (client) => {
      const {projectId} = client.config()
      if (projectId === undefined) {
        return []
      }

      const existingIndex = projectIndex[projectId]
      if (existingIndex) {
        // If we have the index, resolve apps from the main cache
        const appIds = await existingIndex
        return Promise.all(appIds.map((id) => appCache[id]))
      }

      const projectClient = client.withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS)

      const promise = projectClient
        .request<UserApplication[]>({
          method: 'GET',
          url: `/projects/${projectId}/user-applications`,
          tag: 'user-application-cache.fetch-user-applications',
        })
        .then((apps: UserApplication[]) => {
          // Store each app in the main cache and replace promise with resolved IDs
          projectIndex[projectId] = apps.map((app) => {
            appCache[app.id] = app
            return app.id
          })
          return apps
        })
        .catch((err) => {
          debug(`Fetching user application failed.`, {err})
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
