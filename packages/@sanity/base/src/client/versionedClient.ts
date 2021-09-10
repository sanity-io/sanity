// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

/**
 * @internal INTERNAL! Don't use outside of @sanity/base!
 *
 * Preconfigured, versioned client used for all the
 * internal tooling within @sanity/base.
 */
import type {SanityClient} from '@sanity/client'
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

/**
 * Only for use inside of @sanity/base
 * Don't import this from external modules.
 *
 * Gets a client configured with the passed API version,
 * re-using clients where possible
 *
 * @internal
 */
export const getVersionedClient = (() => {
  const clientMap = new Map<string, SanityClient>()
  return function getVersionedSanityClient(version: string | undefined): SanityClient {
    const apiVersion = version || '1'

    if (!clientMap.has(apiVersion)) {
      clientMap.set(apiVersion, sanityClient.withConfig({apiVersion}))
    }

    return clientMap.get(apiVersion)
  }
})()
