import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {type ReleaseId} from './types'

/** Why a `?perspective=` value was not used. */
export type IgnoredPerspectiveReason = 'drafts' | 'unknown-release' | 'releases-off'

export interface ResolvedStickyPerspective {
  /** The perspective name the studio selects. `undefined` is Drafts. */
  name: 'published' | ReleaseId | undefined
  /** Set when the URL's value was not used, and why. */
  ignored?: IgnoredPerspectiveReason
}

/**
 * The perspective the studio selects for the URL's `?perspective=` value.
 *
 * The URL is not checked anywhere else, so a value the studio never writes reached the document
 * pane as a release id: `drafts` (crashes the structure tool), a release id or name that matches no
 * release (offered "Add to release"), or a release in a workspace with releases off. Those fall
 * back to the workspace's default perspective. While the releases are loading, a release id is
 * kept as it is, so a link to a real release does not flash the default first. Archived and
 * published releases are left to `ResetArchivedReleasePerspective`, which explains them.
 *
 * @internal
 */
export function resolveStickyPerspectiveName({
  perspective,
  activeReleases,
  archivedReleases,
  releasesLoading,
  releasesEnabled,
  isDraftModelEnabled,
}: {
  perspective: string | undefined
  activeReleases: ReleaseDocument[]
  archivedReleases: ReleaseDocument[]
  releasesLoading: boolean
  releasesEnabled: boolean
  isDraftModelEnabled: boolean
}): ResolvedStickyPerspective {
  const fallback = isDraftModelEnabled ? undefined : 'published'

  if (typeof perspective === 'undefined' || perspective === '') return {name: fallback}
  if (perspective === 'published') return {name: 'published'}
  if (perspective === 'drafts') {
    // Drafts is the default when drafts are on, so the param is redundant; with drafts off there
    // is no drafts perspective at all.
    return isDraftModelEnabled ? {name: undefined} : {name: fallback, ignored: 'drafts'}
  }

  const releaseId = perspective as ReleaseId
  if (releasesLoading) return {name: releaseId}

  const matches = (release: ReleaseDocument) =>
    getReleaseIdFromReleaseDocumentId(release._id) === releaseId
  const active = activeReleases.find(matches)
  if (!active) {
    return archivedReleases.some(matches)
      ? {name: releaseId}
      : {name: fallback, ignored: 'unknown-release'}
  }
  if (!releasesEnabled && !isCardinalityOneRelease(active)) {
    return {name: fallback, ignored: 'releases-off'}
  }
  return {name: releaseId}
}
