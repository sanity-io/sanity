import {type SanityClient} from '@sanity/client'

import {type MediaLibraryRef} from '../../../../../store/accessPolicy/refs'

export function resolveMediaLibraryClient(params: {client: SanityClient; ref: MediaLibraryRef}) {
  const {client, ref} = params

  const [, libraryId] = ref.split(':', 2)
  if (!libraryId) {
    return undefined
  }

  return client.withConfig({
    '~experimental_resource': {
      id: libraryId,
      type: 'media-library',
    },
  })
}
