// @flow
import Observable from '@sanity/observable'
import {uploadImage} from '../inputs/client-adapters/assets'
import readExif from './image/readExif'
import rotateImage from './image/rotateImage'
import {DEFAULT_ORIENTATION} from './image/orient'
import {set, unset} from '../../utils/patches'
import type {OrientationId} from './image/orient'

type Exif = {
  orientation: OrientationId
}

export default function importImage(file: File) {
  return Observable.from(readExif(file))
    .mergeMap((exif: Exif) => rotateImage(file, exif.orientation || DEFAULT_ORIENTATION))
    .catch(error => {
      console.warn('Image preprocessing failed: ', error)
      // something went wrong, but continue still
      return Observable.of(null)
    })
    .map(imageUrl => ({
      patches: [
        set({
          percent: 0,
          previewImage: imageUrl
        }, ['_import'])
      ]
    }))
    .merge(
      uploadImage(file)
        .map(event => {
          if (event.type === 'complete') {
            return {
              ...event,
              patches: [
                unset(['_import']),
                set({_type: 'reference', _ref: event.asset._id}, ['asset'])
              ]
            }
          }
          return {
            ...event,
            patches: [set(event.percent, ['_import', 'percent'])]
          }
        })
    )

}
