import {ClientError, type SanityClient} from '@sanity/client'

/**
 * Deletes a key from the per-user server keyvalue store (`/users/me/keyvalue`),
 * ignoring the 404 the API responds with when the key doesn't exist. Any other
 * failure (auth, network, etc.) is rethrown so tests don't silently proceed
 * against stale state.
 */
export async function clearKeyValueKey(client: SanityClient, key: string): Promise<void> {
  try {
    await client.withConfig({apiVersion: '2024-03-12'}).request({
      uri: `/users/me/keyvalue/${key}`,
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof ClientError && err.statusCode === 404) {
      return
    }
    throw err
  }
}
