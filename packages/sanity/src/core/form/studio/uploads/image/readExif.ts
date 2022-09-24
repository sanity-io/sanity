import {Observable, of as observableOf, from as observableFrom} from 'rxjs'
import {map, catchError} from 'rxjs/operators'
import exif from 'exif-component'

function readFileAsArrayBuffer(
  file: File,
  length: number
): Observable<string | ArrayBuffer | null> {
  return new Observable((observer) => {
    const reader = new window.FileReader()
    reader.onerror = (err) => observer.error(err)
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

export function readExif(file: File) {
  return observableFrom(readFileAsArrayBuffer(file, EXIF_BUFFER_LENGTH)).pipe(
    map((buf) => exif(buf)),
    catchError((error) => {
      if (!SKIP_EXIF_ERROR_RE.test(error.message)) {
        // Exif read failed, we do not want to fail hard
        console.warn(`Exif read failed, continuing anyway: ${error.message}`) // eslint-disable-line no-console
      }
      return observableOf({})
    })
  )
}
