import {UploadEvent} from './typedefs'
import {UPLOAD_STATUS_KEY} from './constants'
import {set, unset} from '../../utils/patches'

const UNSET_UPLOAD_PATCH = unset([UPLOAD_STATUS_KEY])

export function createUploadEvent(patches = []): UploadEvent {
  return {
    type: 'uploadEvent',
    patches
  }
}

export const CLEANUP_EVENT = createUploadEvent([UNSET_UPLOAD_PATCH])

export function createInitialUploadEvent(file: File) {
  return createUploadEvent([
    set(
      {
        progress: 2,
        initiated: new Date().toISOString(),
        file: {name: file.name, type: file.type}
      },
      [UPLOAD_STATUS_KEY]
    )
  ])
}
