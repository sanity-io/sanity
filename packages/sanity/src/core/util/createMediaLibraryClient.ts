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
  const {apiHost: base, projectId: subdomain} = client.config()

  if (!subdomain) {
    throw new Error('Cannot create Media Library client: missing projectId in client config')
  }

  const baseUrl = new URL(base)
  baseUrl.hostname = `${subdomain}.${baseUrl.hostname}`
  const apiHost = baseUrl.toString()

  return client.withConfig({
    apiHost,
    resource: {
      id: libraryId,
      type: 'media-library',
    },
  })
}
