import {RELEASE_DOCUMENTS_PATH} from '../../store/release/constants'

const PATH_ID_PREFIX = `${RELEASE_DOCUMENTS_PATH}.`
export function getBundleIdFromReleaseId(releaseId: string) {
  if (!releaseId.startsWith(PATH_ID_PREFIX)) {
    throw new Error(`Release ID should start with ${RELEASE_DOCUMENTS_PATH}`)
  }
  return releaseId.slice(PATH_ID_PREFIX.length)
}
