import Observable from '@sanity/observable'
import exif from 'exif-component'

function readFileAsArrayBuffer(file, length) {
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

// 128k should be enough for exif data according to https://github.com/mattiasw/ExifReader#tips
const EXIF_BUFFER_LENGTH = 128000
export default function readExif(file) {
  return readFileAsArrayBuffer(file, EXIF_BUFFER_LENGTH)
    .map(buf => exif(buf))
}
