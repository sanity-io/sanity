import {type ReleaseDocument} from '@sanity/client'

/**
 * Checks if a release is a paused scheduled draft.
 *
 * A paused scheduled draft is a single-doc release that has been unscheduled
 * for editing but still retains its original scheduled date in metadata.
 *
 * @param release - The release document to check
 * @returns true if the release is a paused scheduled draft
 * @internal
 */
export function isPausedScheduledDraft(release: ReleaseDocument | undefined): boolean {
  if (!release) return false
  return (
    release.state === 'active' &&
    release.metadata.releaseType === 'scheduled' &&
    release.metadata.cardinality === 'one' &&
    Boolean(release.metadata.intendedPublishAt)
  )
}
