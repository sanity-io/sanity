// @flow
import Observable from '@sanity/observable'
import {uploadFile as uploadFileAsset} from '../inputs/client-adapters/assets'
import {set} from '../../utils/patches'
import type {ObservableI} from '../../typedefs/observable'
import type {UploadEvent} from './typedefs'
import {UPLOAD_STATUS_KEY} from './constants'
import {CLEANUP_EVENT, createUploadEvent, INIT_EVENT} from './utils'

const setInitialUploadState$ = Observable.of(INIT_EVENT)
const unsetUploadState$ = Observable.of(CLEANUP_EVENT)

export default function uploadFile(file: File): ObservableI<UploadEvent> {
  const upload$ = uploadFileAsset(file)
    .map(event => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'percent'])
        ])
      }
      return createUploadEvent([set(event.percent, [UPLOAD_STATUS_KEY, 'percent'])])
    })

  return setInitialUploadState$
    .concat(upload$)
    .concat(unsetUploadState$)
}
