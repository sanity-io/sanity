import {type PerspectiveBundle, type TargetPerspective} from '../../perspective/types'
import {isReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'

export function getBundleIdFromPerspective(
  selectedPerspective: TargetPerspective,
): PerspectiveBundle {
  if (isPublishedPerspective(selectedPerspective)) {
    return '$published'
  }

  if (isDraftPerspective(selectedPerspective)) {
    return 'drafts'
  }

  if (isReleaseDocument(selectedPerspective)) {
    return getReleaseIdFromReleaseDocumentId(selectedPerspective._id)
  }

  if (typeof selectedPerspective === 'string') {
    return selectedPerspective
  }

  return 'drafts'
}
