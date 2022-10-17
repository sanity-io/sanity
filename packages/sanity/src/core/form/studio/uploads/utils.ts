import {FormPatch, set, setIfMissing, unset} from '../../patch'
import {UploadProgressEvent} from './types'
import {UPLOAD_STATUS_KEY} from './constants'

const UNSET_UPLOAD_PATCH = unset([UPLOAD_STATUS_KEY])

export function createUploadEvent(patches: FormPatch[] = []): UploadProgressEvent {
  return {
    type: 'uploadProgress',
    patches,
  }
}

export const CLEANUP_EVENT = createUploadEvent([UNSET_UPLOAD_PATCH])

export function createInitialUploadEvent(file: File) {
  const now = new Date().toISOString()
  const value = {
    progress: 2,
    initiated: now,
    updated: now,
    file: {name: file.name, type: file.type},
  }

  return createUploadEvent([
    setIfMissing({[UPLOAD_STATUS_KEY]: value}, []),
    set(value, [UPLOAD_STATUS_KEY]),
  ])
}
