import {set, unset, setIfMissing} from '../../patch/patches'
import {UploadEvent} from './types'
import {UPLOAD_STATUS_KEY} from './constants'

const UNSET_UPLOAD_PATCH = unset([UPLOAD_STATUS_KEY])

export function createUploadEvent(patches = []): UploadEvent {
  return {
    type: 'uploadEvent',
    patches,
  }
}

export const CLEANUP_EVENT = createUploadEvent([UNSET_UPLOAD_PATCH])

export function createInitialUploadEvent(file: File) {
  const value = {
    progress: 2,
    initiated: new Date().toISOString(),
    file: {name: file.name, type: file.type},
  }
  return createUploadEvent([
    setIfMissing({[UPLOAD_STATUS_KEY]: value}, []),
    set(value, [UPLOAD_STATUS_KEY]),
  ])
}
