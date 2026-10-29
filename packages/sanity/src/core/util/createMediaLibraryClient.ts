import {type SanityClient} from '@sanity/client'

/**
 * Creates a Media Library-specific client with an explicitly configured API
 * host that includes the project ID in the subdomain. This is to satisfy CORS
 * requirements, as browser requests will fail against the global host because
 * it does not include CORS headers. (Setting `resource` on a client makes it
 * ignore `useProjectHostname` and target the global API host.)
 *
 * @internal
 */
export function createMediaLibraryClient(client: SanityClient, libraryId: string): SanityClient {
  const {apiHost, projectId} = client.config()

  if (!projectId) {
    throw new Error('Cannot create Media Library client: missing projectId in client config')
  }

  const baseUrl = new URL(apiHost)
  baseUrl.hostname = `${projectId}.${baseUrl.hostname}`

  return client.withConfig({
    // `origin` (rather than `toString()`) avoids a trailing slash and drops
    // any pathname/search/hash that may have been configured on `apiHost`
    apiHost: baseUrl.origin,
    resource: {
      id: libraryId,
      type: 'media-library',
    },
  })
}
