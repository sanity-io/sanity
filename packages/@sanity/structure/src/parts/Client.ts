import {ClientConfig, SanityClient} from '@sanity/client'
import getDefaultModule from './getDefaultModule'

type StudioClient = SanityClient & {withConfig: (config: Partial<ClientConfig>) => SanityClient}

/**
 * Default client for queries, using API version 1 for backwards compatibility
 *
 * @internal
 */
export const client = ((): SanityClient => {
  // We are lazy-loading the part to work around typescript trying to resolve it
  const sanityClient: StudioClient = getDefaultModule(require('part:@sanity/base/client'))
  return sanityClient.withConfig({apiVersion: '1'})
})()

/**
 * For structure-internal requests that we have control of the filter on,
 * we'll use this client with a more modern API version
 *
 * @internal
 */
export const structureClient = client.withConfig({apiVersion: '2021-06-07'})
