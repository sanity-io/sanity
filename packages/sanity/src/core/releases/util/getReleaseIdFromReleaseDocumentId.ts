import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

const PATH_ID_PREFIX = `${RELEASE_DOCUMENTS_PATH}.`

/**
 * @internal
 * @param releaseDocumentId - the document id of the release
 */
export function getReleaseIdFromReleaseDocumentId(releaseDocumentId: string) {
  if (!releaseDocumentId.startsWith(PATH_ID_PREFIX)) {
    throw new Error(
      `Release document ID was ${releaseDocumentId} but should start with ${RELEASE_DOCUMENTS_PATH}`,
    )
  }
  return releaseDocumentId.slice(PATH_ID_PREFIX.length)
}
