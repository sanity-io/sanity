import {type DocumentSystem, type DocumentSystemRef} from '@sanity/types'

import {type TargetPerspective} from '../../perspective/types'
import {isReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'

export function getBundleIdFromPerspective(
  selectedPerspective: TargetPerspective,
): Pick<DocumentSystem, 'bundleId' | 'release'> {
  if (isPublishedPerspective(selectedPerspective)) {
    return {bundleId: '$published', release: null}
  }

  if (isDraftPerspective(selectedPerspective)) {
    return {bundleId: 'drafts', release: null}
  }

  if (isReleaseDocument(selectedPerspective)) {
    const releaseRef: DocumentSystemRef = {
      _type: 'reference',
      _ref: selectedPerspective._id,
      _weak: true,
    }
    return {
      bundleId: getReleaseIdFromReleaseDocumentId(selectedPerspective._id),
      release: releaseRef,
    }
  }

  if (typeof selectedPerspective === 'string') {
    return {bundleId: selectedPerspective, release: null}
  }

  return {bundleId: 'drafts', release: null}
}
