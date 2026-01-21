import {type SanityClient} from '@sanity/client'

import {type MediaLibraryRef} from '../../../../../store/accessPolicy/refs'

export function resolveMediaLibraryClient(params: {client: SanityClient; ref: MediaLibraryRef}) {
  const {client, ref} = params

  return client
}
