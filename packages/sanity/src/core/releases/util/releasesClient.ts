import {type ClientPerspective} from '@sanity/client'

import {type SourceClientOptions} from '../../config/types'

export const RELEASES_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  apiVersion: 'X',
}

export const isReleasePerspective = (
  perspective: ClientPerspective | undefined | string | string[],
): boolean => {
  if (Array.isArray(perspective)) {
    return true
  }
  return false
}
