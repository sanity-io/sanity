// @flow
import Observable from '@sanity/observable'
import exif from 'exif-component'

function readFileAsArrayBuffer(file: File, length: number) {
  return new Observable(observer => {
    /* global window */
    const reader = new window.FileReader()
    reader.onerror = err => observer.error(err)
    reader.onload = () => {
      observer.next(reader.result)
      observer.complete()
    }
    reader.readAsArrayBuffer(length === undefined ? file : file.slice(0, length))
    return () => reader.abort()
  })
}

const SKIP_EXIF_ERROR_RE = /(invalid image format)|(No exif data)/i

// 128k should be enough for exif data according to https://github.com/mattiasw/ExifReader#tips
const EXIF_BUFFER_LENGTH = 128000

export default function readExif(file: File) {
  return Observable.from(readFileAsArrayBuffer(file, EXIF_BUFFER_LENGTH))
    .map(buf => exif(buf))
    .catch(error => {
      if (!SKIP_EXIF_ERROR_RE.test(error.message)) {
        // Exif read failed, we do not want to fail hard
        error.message = `Exif read failed, continuing anyway: ${error.message}`
        console.error(error) // eslint-disable-line no-console
      }
      return Observable.of({})
    })
}
