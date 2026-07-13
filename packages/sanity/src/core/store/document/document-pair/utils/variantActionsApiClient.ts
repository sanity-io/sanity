import {type SanityClient} from '@sanity/client'

import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../../../variants/store/constants'
import {variantsClient} from '../../../../variants/store/variantsClient'

/**
 * Returns a client configured for variant document actions (publish/unpublish/delete).
 * Mirrors `actionsApiClient`, which configures the base/release actions API version.
 *
 * The cast exists because `@sanity/client` does not export the variant action types yet — same
 * situation as `variantsClient` in `core/variants/store/variantsClient.ts`.
 */
export function variantActionsApiClient(client: SanityClient) {
  return variantsClient(client.withConfig(VARIANTS_STUDIO_CLIENT_OPTIONS))
}
