/**
 * @internal INTERNAL! Don't use outside of @sanity/base!
 *
 * Preconfigured, versioned client used for all the
 * internal tooling within @sanity/base.
 */
import sanityClient from 'part:@sanity/base/client'

export const versionedClient = sanityClient.withConfig({
  /**
   * NOTE: CHANGING THIS VERSION MEANS YOU'LL HAVE TO TEST
   * EVERYTHING THAT DEPENDS ON THIS VERSIONED CLIENT WITHIN
   * @sanity/base!
   */
  apiVersion: '1',
})
