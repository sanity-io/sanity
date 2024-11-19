import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

const PATH_ID_PREFIX = `${RELEASE_DOCUMENTS_PATH}.`

/**
 * @internal
 * @param releaseId - the document id of the release
 */
export function getBundleIdFromReleaseDocumentId(releaseId: string) {
  if (!releaseId.startsWith(PATH_ID_PREFIX)) {
    throw new Error(`Release ID was ${releaseId} but should start with ${RELEASE_DOCUMENTS_PATH}`)
  }
  return releaseId.slice(PATH_ID_PREFIX.length)
}
