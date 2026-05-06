import {getDraftId, getPublishedId, getVersionId} from '@sanity/client/csm'

import {type DocumentTarget} from './types'

// Resolves the explicit document target to the one id the document pipelines should observe;
// this replaces pair id expansion for the document-scoped API.
export async function resolveTarget(target: DocumentTarget): Promise<string> {
  // This function is marked as async to prepare for future operation in where we will need to query the document
  // to resolved the correct id.

  if (target.bundleId === 'drafts') {
    return getDraftId(target.baseId)
  }

  if (target.bundleId === 'published') {
    return getPublishedId(target.baseId)
  }

  if (!target.bundleId) {
    throw new Error('Invalid release id')
  }

  return getVersionId(target.baseId, target.bundleId)
}
