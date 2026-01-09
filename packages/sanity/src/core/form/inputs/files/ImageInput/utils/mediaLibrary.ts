import {type SanityClient} from '@sanity/client'

import {type MediaLibraryRef} from '../../../../../store/accessPolicy/refs'

export function resolveMediaLibraryClient(params: {
  client: SanityClient
  ref: MediaLibraryRef
}): SanityClient {
  const {client, ref} = params

  const [, libraryId] = ref.split(':', 2)

  return client.withConfig({
    // Use '~experimental_resource' here as this client instance will be passed
    // to the image URL builder which does not yet support 'resource'
    '~experimental_resource': {
      id: libraryId,
      type: 'media-library',
    },
  })
}
