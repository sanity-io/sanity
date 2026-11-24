import {getVersionFromId} from '../../../util/draftUtils'
import {type InternalReferences} from './deletionMachine'

/**
 * The internal references to list when content releases are off: a link held only in a release
 * version (`failsLater`) is left out, as the rest of the studio leaves out releases. A link held in
 * a scheduled draft is kept, since scheduled drafts still publish with releases off and fail if the
 * target is gone. `scheduledDraftIds` are the release ids of the active scheduled drafts.
 */
export function withoutReleaseOnlyReferences(
  internalReferences: InternalReferences,
  scheduledDraftIds: ReadonlySet<string>,
): InternalReferences {
  const references = internalReferences.references.filter((reference) => {
    if (reference.failsLater !== true) return true
    const releaseId = getVersionFromId(reference._id)
    return releaseId !== undefined && scheduledDraftIds.has(releaseId)
  })
  const removed = internalReferences.references.length - references.length
  return removed === 0
    ? internalReferences
    : {...internalReferences, totalCount: internalReferences.totalCount - removed, references}
}
