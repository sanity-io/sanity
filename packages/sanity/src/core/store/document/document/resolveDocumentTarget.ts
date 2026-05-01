import {getDraftId, getPublishedId, getVersionId, isVersionId} from '@sanity/client/csm'

import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type DocumentTarget} from './types'

// Resolves the explicit document target to the one id the document pipelines should observe;
// this replaces pair id expansion for the document-scoped API.
export function resolveTarget(target: DocumentTarget): string {
  if (isVersionId(target.version)) {
    const versionName = getReleaseIdFromReleaseDocumentId(target.version)
    if (!versionName) {
      throw new Error(`Invalid version: ${target.version}`)
    }
    return getVersionId(target.baseId, versionName)
  }

  if (target.version === 'drafts') {
    return getDraftId(target.baseId)
  }

  if (target.version === 'published') {
    return getPublishedId(target.baseId)
  }
  throw new Error(`Invalid version: ${target.version}`)
}
