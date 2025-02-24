import {type ClientPerspective} from '@sanity/client'

import {type SourceClientOptions} from '../../config/types'

/**
 * @internal This is the client options used for the releases studio client, using the `X` API version for now
 * Will change to a specific version soon.
 * TODO: Remove after API version is stable and support releases
 */
export const RELEASES_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  apiVersion: 'v2025-02-19',
}

/**
 * @internal Checks if the perspective is a release perspective
 * TODO: Remove after API version is stable and support releases
 */
export const isReleasePerspective = (
  perspective: ClientPerspective | undefined | string | string[],
): boolean => {
  if (Array.isArray(perspective)) {
    return true
  }
  return false
}
