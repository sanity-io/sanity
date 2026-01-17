import {type SanityClient} from '@sanity/client'

import {type MediaLibraryRef} from '../../../../../store/accessPolicy/refs'

export function resolveMediaLibraryClient(params: {
  client: SanityClient
  ref: MediaLibraryRef
}): SanityClient {
  const {client, ref} = params

  const [, libraryId] = ref.split(':', 2)

  const {apiHost: base, projectId: subdomain} = client.config()
  const baseUrl = new URL(base)
  baseUrl.hostname = `${subdomain}.${baseUrl.hostname}`
  const apiHost = baseUrl.toString()

  return client.withConfig({
    // apiHost,
    // Use '~experimental_resource' here as this client instance will be passed
    // to the image URL builder which does not yet support 'resource'
    resource: {
      id: libraryId,
      type: 'media-library',
    },
  })
}
