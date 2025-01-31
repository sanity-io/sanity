import {type ClientPerspective} from '@sanity/client'

import {type SourceClientOptions} from '../../config/types'

/**
 * @internal This is the client options used for the releases studio client, using the `X` API version for now
 * Will change to a specific version soon.
 */
export const RELEASES_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  apiVersion: 'X',
}

/**
 * @internal Checks if the perspective is a release perspective
 */
export const isReleasePerspective = (
  perspective: ClientPerspective | undefined | string | string[],
): boolean => {
  if (Array.isArray(perspective)) {
    return true
  }
  return false
}
