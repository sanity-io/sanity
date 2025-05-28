import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

export function getReleaseDocumentIdFromReleaseId(name: string) {
  return `${RELEASE_DOCUMENTS_PATH}.${name}`
}
