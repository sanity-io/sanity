import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

/**
 * Builds the release document id (`_.releases.<releaseId>`) from a release id.
 *
 * @internal
 */
export function getReleaseDocumentIdFromReleaseId(releaseId: string) {
  return `${RELEASE_DOCUMENTS_PATH}.${releaseId}`
}
