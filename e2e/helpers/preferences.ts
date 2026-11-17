import {type Response} from '@playwright/test'
import {type SanityClient} from '@sanity/client'

const PREFERENCES_PATH = '/users/me/preferences/'

/**
 * Removes the current user's preference in the client's project, so a test starts from the
 * default. Removing one that isn't set succeeds; any other failure throws, so tests don't silently
 * proceed against stale state.
 */
export async function clearPreference(client: SanityClient, key: string): Promise<void> {
  const {projectId} = client.config()
  await client.withConfig({apiVersion: '2026-11-07'}).request({
    url: `/projects/${projectId}${PREFERENCES_PATH}${encodeURIComponent(key)}`,
    method: 'DELETE',
  })
}

/**
 * Whether a response is the Studio storing the given preference. The body is the stored
 * preference: `{key, value, ...}`.
 */
export function isPreferenceWrite(response: Response, key: string): boolean {
  const path = decodeURIComponent(new URL(response.url()).pathname)
  return response.request().method() === 'PUT' && path.endsWith(`${PREFERENCES_PATH}${key}`)
}
