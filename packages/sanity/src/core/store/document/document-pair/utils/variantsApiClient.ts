import {type SanityClient} from '@sanity/client'

import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../../../variants/store/constants'

/**
 * Return a client using the minimum Sanity API version that supports
 * Content Variants.
 */
export function variantsApiClient(client: SanityClient): SanityClient {
  return client.withConfig(VARIANTS_STUDIO_CLIENT_OPTIONS)
}
