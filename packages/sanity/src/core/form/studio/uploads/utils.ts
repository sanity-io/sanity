import type {FormPatch} from '../../patch/types'
import {set, unset} from '../../patch/patch'
import {UPLOAD_STATUS_KEY} from './constants'
import {type UploadProgressEvent} from './types'

const UNSET_UPLOAD_PATCH = unset([UPLOAD_STATUS_KEY])

export function createUploadEvent(patches: FormPatch[] = []): UploadProgressEvent {
  return {
    type: 'uploadProgress',
    patches,
  }
}

export const CLEANUP_EVENT = createUploadEvent([UNSET_UPLOAD_PATCH])

export function createInitialUploadEvent(file: File) {
  return createUploadEvent(createInitialUploadPatches(file))
}

export function createInitialUploadPatches(file: File) {
  const now = new Date().toISOString()
  const value = {
    progress: 2,
    createdAt: now,
    updatedAt: now,
    file: {name: file.name, type: file.type},
  }

  return [set(value, [UPLOAD_STATUS_KEY])]
}
