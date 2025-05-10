import exif from 'exif-component'
import {from as observableFrom, Observable, of as observableOf} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

function readFileAsArrayBuffer(
  file: File,
  length: number,
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

/**
 * Sanitizes string values in EXIF data to handle null-terminated strings
 * from manufacturers like Fujifilm. This prevents Unicode validation errors
 * when storing the data in Sanity.
 */
function sanitizeExifData(exifData: unknown): Record<string, unknown> {
  // If exifData is null, undefined, or not an object, return an empty object
  if (!exifData || typeof exifData !== 'object') {
    return {}
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(exifData as Record<string, unknown>)) {
    if (typeof value === 'string') {
      // Trim the string at the first null character (if any)
      const nullTerminatorIndex = value.indexOf('\0')
      if (nullTerminatorIndex === -1) {
        result[key] = value
      } else {
        result[key] = value.slice(0, Math.max(0, nullTerminatorIndex))
      }
    } else if (value !== null && typeof value === 'object') {
      // Recursively sanitize nested objects
      result[key] = sanitizeExifData(value)
    } else {
      result[key] = value
    }
  }

  return result
}

export function readExif(file: File) {
  return observableFrom(readFileAsArrayBuffer(file, EXIF_BUFFER_LENGTH)).pipe(
    map((buf) => exif(buf)),
    map((exifData) => sanitizeExifData(exifData)), // Sanitize the EXIF data
    catchError((error) => {
      if (!SKIP_EXIF_ERROR_RE.test(error.message)) {
        // Exif read failed, we do not want to fail hard
        console.warn(`Exif read failed, continuing anyway: ${error.message}`) // eslint-disable-line no-console
      }
      return observableOf({})
    }),
  )
}
