import {type ReleaseDocument} from '@sanity/client'

import {type TargetPerspective} from '../../../perspective/types'
import {isReleaseDocument} from '../../../releases/store/types'
import {isReleaseScheduledOrScheduling} from '../../../releases/util/util'

/**
 * Where "Create version" puts a missing version, and why, when the selected release could not
 * take it.
 *
 * @internal
 */
export type MissingVersionDestination =
  | {kind: 'release'; release: ReleaseDocument; perspective: ReleaseDocument}
  | {
      kind: 'drafts' | 'published'
      perspective: 'drafts' | 'published'
      /** The selected release that could not take the version, and why. */
      fallback?: {release: ReleaseDocument; reason: 'scheduled' | 'locked'}
    }

/**
 * Follows the selected perspective, like the version inventory's create: a selected release that
 * can take changes (active: not scheduled, archived or published) gets the version. Otherwise it
 * goes to Drafts, or Published for live-edit types, which have no drafts.
 *
 * @internal
 */
export function getMissingVersionDestination({
  selectedPerspective,
  liveEdit,
}: {
  selectedPerspective: TargetPerspective | undefined
  liveEdit: boolean
}): MissingVersionDestination {
  const base = liveEdit ? 'published' : 'drafts'

  if (isReleaseDocument(selectedPerspective)) {
    if (selectedPerspective.state === 'active') {
      return {kind: 'release', release: selectedPerspective, perspective: selectedPerspective}
    }
    return {
      kind: base,
      perspective: base,
      fallback: {
        release: selectedPerspective,
        reason: isReleaseScheduledOrScheduling(selectedPerspective) ? 'scheduled' : 'locked',
      },
    }
  }

  return {kind: base, perspective: base}
}
