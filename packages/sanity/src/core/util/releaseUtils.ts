import {type ReleaseDocument} from '@sanity/client'

/**
 * Check if the release is a cardinality one release
 *
 * @internal
 */
export function isCardinalityOneRelease(release: ReleaseDocument): release is ReleaseDocument & {
  metadata: ReleaseDocument['metadata'] & {
    cardinality: 'one'
  }
} {
  return release.metadata.cardinality === 'one'
}
