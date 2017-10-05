// @flow
import Observable from '@sanity/observable'
import readExif from './image/readExif'
import rotateImage from './image/rotateImage'
import {DEFAULT_ORIENTATION} from './image/orient'
import {set} from '../../utils/patches'
import type {UploadEvent} from './typedefs'
// The eslint import plugin doesn't work well with opaque types
// https://github.com/benmosher/eslint-plugin-import/issues/921
// https://github.com/gajus/eslint-plugin-flowtype/issues/260
// eslint-disable-next-line import/named
import type {OrientationId} from './image/orient'
import type {ObservableI} from '../../typedefs/observable'
import {UPLOAD_STATUS_KEY} from './constants'
import {CLEANUP_EVENT, INIT_EVENT, createUploadEvent} from './utils'
import {createUploadId, getUploadEvents, scheduleUpload} from './uploadQueue'

type Exif = {
  orientation: OrientationId
}

const setInitialUploadState$ = Observable.of(INIT_EVENT)
const unsetUploadState$ = Observable.of(CLEANUP_EVENT)

export default function uploadImage(file: File): ObservableI<UploadEvent> {
  const uploadId = createUploadId(file)

  const upload$ = getUploadEvents(uploadId)
    .filter(event => event.stage !== 'download')
    .map(event => ({
      ...event,
      percent: 2 + ((event.percent / 100) * 98)
    }))
    .map(event => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'percent'])
        ])
      }
      return createUploadEvent([set(event.percent, [UPLOAD_STATUS_KEY, 'percent'])])
    })

  const setPreviewUrl$ = readExif(file)
    .mergeMap((exifData: Exif) => rotateImage(file, exifData.orientation || DEFAULT_ORIENTATION))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.warn('Image preprocessing failed: ', error)
      // something went wrong, but continue still
      return Observable.of(null)
    })
    .filter(Boolean)
    .map(imageUrl => createUploadEvent([set(imageUrl, [UPLOAD_STATUS_KEY, 'previewImage'])]))

  scheduleUpload(uploadId, file)

  return setInitialUploadState$
    .concat(Observable.from(upload$).merge(setPreviewUrl$))
    .concat(unsetUploadState$)
}
