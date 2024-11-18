import {RELEASE_DOCUMENTS_PATH} from '../store/constants'

export function getReleaseIdFromName(name: string) {
  return `${RELEASE_DOCUMENTS_PATH}.${name}`
}
