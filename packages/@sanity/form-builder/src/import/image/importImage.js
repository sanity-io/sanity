import Observable from '@sanity/observable'
import rotateImage from './rotateImage'
import readExif from './readExif'

const SKIP_EXIF_ERROR_RE = /(invalid image format)|(No exif data)/i

export default function importImage(file) {
  return readExif(file)
    .map(exifData => {
      // Only care about orientation (for now)
      return {orientation: exifData.orientation}
    })
    .catch(error => {
      if (!SKIP_EXIF_ERROR_RE.test(error.message)) {
        // Exif read failed, we do not want to fail hard
        error.message = `Exif read failed, continuing anyway: ${error.message}`
        console.error(error) // eslint-disable-line no-console
      }
      return Observable.of(null)
    })
    .mergeMap(exif => {
      return previewUrlWithCorrectedOrientation(file, (exif || {}).orientation)
        .map(imageUrl => ({
          _imageUrl: imageUrl
        }))
    })
}

function previewUrlWithCorrectedOrientation(file, orientation) {
  return (orientation && orientation !== 'top-left')
    ? rotateImage(file, orientation)
    : Observable.of(window.URL.createObjectURL(file))
}
