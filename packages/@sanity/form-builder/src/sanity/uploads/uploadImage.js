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
import {createUploadEvent, createInitialUploadEvent, CLEANUP_EVENT} from './utils'
import {uploadImageAsset} from '../inputs/client-adapters/assets'

type Exif = {
  orientation: OrientationId
}

export default function uploadImage(file: File): ObservableI<UploadEvent> {
  const upload$ = uploadImageAsset(file)
    .filter(event => event.stage !== 'download')
    .map(event => ({
      ...event,
      progress: 2 + ((event.percent / 100) * 98)
    }))
    .map(event => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress'])
        ])
      }
      return createUploadEvent([set(event.percent, [UPLOAD_STATUS_KEY, 'progress'])])
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

  return Observable.of(createInitialUploadEvent(file))
    .concat(Observable.from(upload$).merge(setPreviewUrl$))
    .concat(Observable.of(CLEANUP_EVENT))
}
