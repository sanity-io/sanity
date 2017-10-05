
import {UploadEvent} from './typedefs'
import {UPLOAD_STATUS_KEY} from './constants'
import {set, unset} from '../../utils/patches'

const SET_UPLOAD_PATCH = set({
  percent: 2,
  initiated: new Date().toISOString()
}, [UPLOAD_STATUS_KEY])

const UNSET_UPLOAD_PATCH = unset([UPLOAD_STATUS_KEY])

export function createUploadEvent(patches = []): UploadEvent {
  return {
    type: 'uploadEvent',
    patches
  }
}
export const INIT_EVENT = createUploadEvent([SET_UPLOAD_PATCH])
export const CLEANUP_EVENT = createUploadEvent([UNSET_UPLOAD_PATCH])
