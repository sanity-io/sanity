// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

/**
 * @internal INTERNAL! Don't use outside of @sanity/base!
 *
 * Preconfigured, versioned client used for all the
 * internal tooling within @sanity/base.
 */
import sanityClient from 'part:@sanity/base/client'

/**
 * Only for use inside of @sanity/base
 * Don't import this from external modules.
 *
 * @internal
 */
export const versionedClient = sanityClient.withConfig({
  /**
   * NOTE: CHANGING THIS VERSION MEANS YOU'LL HAVE TO TEST
   * EVERYTHING THAT DEPENDS ON THIS VERSIONED CLIENT WITHIN
   * @sanity/base!
   */
  apiVersion: '1',
})
