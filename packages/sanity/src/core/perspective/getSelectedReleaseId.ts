import {type ReleaseDocument} from '@sanity/client'

import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isSystemBundleName} from '../util/draftUtils'
import {type ReleaseId} from './types'

/**
 * Resolve the currently selected release id by looking up the live
 * `selectedPerspectiveName` in the active `releases` list.
 *
 * The lookup pairs a list value with the live perspective name, so `releases`
 * must be coherent with `selectedPerspectiveName`: if the list lags behind the
 * selection (e.g. right after a release is created, or if the read were
 * deferred) this returns `undefined` for a release perspective, which callers
 * like reference create-in-place treat as "no release" — writing a weak ref /
 * opening the wrong version. That's why `useActiveReleases` must stay
 * synchronous.
 *
 * @internal
 */
export function getSelectedReleaseId(
  selectedPerspectiveName: 'published' | ReleaseId | undefined,
  releases: ReleaseDocument[],
): ReleaseId | undefined {
  if (isSystemBundleName(selectedPerspectiveName)) return undefined
  return releases
    .map((release) => getReleaseIdFromReleaseDocumentId(release._id))
    .find((releaseName) => releaseName === selectedPerspectiveName) as ReleaseId | undefined
}
