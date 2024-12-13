import {type ReleaseId} from '@sanity/client'

import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

const PATH_ID_PREFIX = `${RELEASE_DOCUMENTS_PATH}.`

/**
 * @internal
 * @param releaseDocumentId - the document id of the release
 */
export function getReleaseIdFromReleaseDocumentId(releaseDocumentId: string): ReleaseId {
  if (!releaseDocumentId.startsWith(PATH_ID_PREFIX)) {
    throw new Error(
      `Release document ID was ${releaseDocumentId} but should start with ${RELEASE_DOCUMENTS_PATH}`,
    )
  }
  const releaseId = releaseDocumentId.slice(PATH_ID_PREFIX.length)
  if (!releaseId.startsWith('r')) {
    throw new Error(`Release id was ${releaseId} but should start with "r"`)
  }
  return releaseId as ReleaseId
}
