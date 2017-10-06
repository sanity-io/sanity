// @flow
import Observable from '@sanity/observable'
import {uploadFileAsset} from '../inputs/client-adapters/assets'
import {set} from '../../utils/patches'
import type {ObservableI} from '../../typedefs/observable'
import type {UploadEvent} from './typedefs'
import {UPLOAD_STATUS_KEY} from './constants'
import {createUploadEvent, createInitialUploadEvent, CLEANUP_EVENT} from './utils'

export default function uploadFile(file: File): ObservableI<UploadEvent> {
  const upload$ = uploadFileAsset(file)
    .map(event => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress'])
        ])
      }
      return createUploadEvent([set(event.percent, [UPLOAD_STATUS_KEY, 'progress'])])
    })

  return Observable.of(createInitialUploadEvent(file))
    .concat(upload$)
    .concat(Observable.of(CLEANUP_EVENT))
}
