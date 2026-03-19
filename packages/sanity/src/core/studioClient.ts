import {type ClientConfig, type SanityClient} from '@sanity/client'

import type {SourceClientOptions} from './config/types'
import {SANITY_VERSION} from './version'

/**
 * Unless otherwise specified, this is the API version we use for controlled
 * requests on internal studio APIs. The user should always ask for a specific
 * API version when using the client - this way we can upgrade which version we
 * use internally without having the users code break unexpectedly. It also
 * means the user can easily upgrade to newer versions of GROQ when it arrives.
 *
 * @internal
 */
export const DEFAULT_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  apiVersion: '2025-02-19',
}

/**
 * The headers that are applied to all studio client requests
 *
 * @internal
 */
export const DEFAULT_STUDIO_CLIENT_HEADERS: ClientConfig['headers'] = {
  'x-sanity-app': `studio@${SANITY_VERSION}`,
}

export const versionedClient = (client: SanityClient, apiVersion?: string): SanityClient => {
  if (apiVersion) {
    return client.withConfig({apiVersion})
  }
  return client
}
