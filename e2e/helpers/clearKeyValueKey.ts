import {type SanityClient} from '@sanity/client'

function getStatusCode(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  const {statusCode, response} = err as {statusCode?: unknown; response?: {statusCode?: unknown}}
  if (typeof statusCode === 'number') return statusCode
  if (typeof response?.statusCode === 'number') return response.statusCode
  return undefined
}

/**
 * Deletes a key from the per-user server keyvalue store (`/users/me/keyvalue`),
 * ignoring the 404 the API responds with when the key doesn't exist. Any other
 * failure (auth, network, etc.) is rethrown so tests don't silently proceed
 * against stale state.
 */
export async function clearKeyValueKey(client: SanityClient, key: string): Promise<void> {
  try {
    await client.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${encodeURIComponent(key)}`,
      method: 'DELETE',
    })
  } catch (err) {
    if (getStatusCode(err) === 404) {
      return
    }
    throw err
  }
}
