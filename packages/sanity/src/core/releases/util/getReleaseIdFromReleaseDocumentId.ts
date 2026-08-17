import {type ReleaseId} from '../../perspective/types'
import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

const PATH_ID_PREFIX = `${RELEASE_DOCUMENTS_PATH}.`

/**
 * Whether the given id addresses a release document (`_.releases.<releaseId>`) rather than
 * being a release id or a system bundle name.
 *
 * @internal
 */
export function isReleaseDocumentId(id: string): boolean {
  return id.startsWith(PATH_ID_PREFIX)
}

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
  return releaseId
}
