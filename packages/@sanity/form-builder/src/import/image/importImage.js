// @flow
import Observable from '@sanity/observable'
import rotateImage from './rotateImage'
import readExif from './readExif'
import {uploadImage} from '../../sanity/inputs/client-adapters/assets'

const SKIP_EXIF_ERROR_RE = /(invalid image format)|(No exif data)/i

export function readExifOrientation(file: File) {
  return readExif(file)
    .map(exifData => {
      // Only care about orientation (for now)
      return exifData.orientation
    })
    .catch(error => {
      if (!SKIP_EXIF_ERROR_RE.test(error.message)) {
        // Exif read failed, we do not want to fail hard
        error.message = `Exif read failed, continuing anyway: ${error.message}`
        console.error(error) // eslint-disable-line no-console
      }
      return Observable.of(null)
    })
}

function previewUrlWithCorrectedOrientation(file, orientation) {
  return (orientation && orientation !== 'top-left')
    ? rotateImage(file, orientation)
    : Observable.of(window.URL.createObjectURL(file))
}

export default function importImage(file: File) {
  return readExifOrientation(file)
    .mergeMap(orientation => previewUrlWithCorrectedOrientation(file, orientation))
    .map(imageUrl => ({
      percent: 0,
      _imageUrl: imageUrl
    }))
    .merge(Observable.from(uploadImage(file)))

}
