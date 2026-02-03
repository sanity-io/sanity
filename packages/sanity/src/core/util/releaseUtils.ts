import {type ReleaseDocument} from '@sanity/client'

import {isReleaseDocument} from '../releases/store/types'

/**
 * A release document with cardinality 'one'
 *
 * @internal
 */
export type CardinalityOneRelease = ReleaseDocument & {
  metadata: ReleaseDocument['metadata'] & {
    cardinality: 'one'
  }
}

/**
 * Check if the release is a cardinality one release
 *
 * @internal
 */
export function isCardinalityOneRelease(
  release: ReleaseDocument,
): release is CardinalityOneRelease {
  return release.metadata?.cardinality === 'one'
}

/**
 * Check if perspective represents a cardinality one release
 *
 * @internal
 */
export function isCardinalityOnePerspective(
  perspective: unknown,
): perspective is CardinalityOneRelease {
  return isReleaseDocument(perspective) && isCardinalityOneRelease(perspective)
}

/**
 * Checks if a release is a paused cardinality one release (scheduled draft).
 *
 * @internal
 */
export function isPausedCardinalityOneRelease(release: ReleaseDocument | undefined): boolean {
  if (!release) return false
  return (
    release.state === 'active' &&
    release.metadata.releaseType === 'scheduled' &&
    isCardinalityOneRelease(release) &&
    Boolean(release.metadata.intendedPublishAt)
  )
}
