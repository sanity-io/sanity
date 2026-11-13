import {type Response} from '@playwright/test'
import {type SanityClient} from '@sanity/client'

const PREFERENCES_PATH = '/users/me/preferences/'

/**
 * Removes the current user's preference in the client's project, so a test starts from the
 * default. Removing one that isn't set succeeds; any other failure throws, so tests don't silently
 * proceed against stale state.
 */
export async function clearPreference(client: SanityClient, key: string): Promise<void> {
  const {apiHost, projectId, token} = client.config()
  // The preferences API lives on the global API host, not the project's
  const url = `${apiHost}/v2026-11-07/projects/${projectId}${PREFERENCES_PATH}${encodeURIComponent(key)}`
  const response = await fetch(url, {method: 'DELETE', headers: {Authorization: `Bearer ${token}`}})
  if (!response.ok) {
    throw new Error(`Clearing the preference "${key}" failed with ${response.status}`)
  }
}

/**
 * Whether a response is the Studio storing a preference, optionally a given key. The body is the
 * stored preference: `{key, value, ...}`.
 */
export function isPreferenceWrite(response: Response, key?: string): boolean {
  const path = decodeURIComponent(new URL(response.url()).pathname)
  return (
    response.request().method() === 'PUT' &&
    path.includes(PREFERENCES_PATH) &&
    (key === undefined || path.endsWith(`${PREFERENCES_PATH}${key}`))
  )
}
