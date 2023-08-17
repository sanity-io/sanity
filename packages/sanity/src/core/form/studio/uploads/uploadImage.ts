import {concat, merge, Observable, of} from 'rxjs'
import {catchError, filter, map, mergeMap} from 'rxjs/operators'
import type {SanityClient} from '@sanity/client'
import {set} from '../../patch'
import {uploadImageAsset} from '../inputs/client-adapters/assets'
import {readExif} from './image/readExif'
import {rotateImage} from './image/rotateImage'
import {DEFAULT_ORIENTATION, Orientation} from './image/orient'
import {UploadOptions, UploadProgressEvent} from './types'
import {UPLOAD_STATUS_KEY} from './constants'
import {CLEANUP_EVENT, createInitialUploadEvent, createUploadEvent} from './utils'

type Exif = {
  orientation: Orientation
}

export function uploadImage(
  client: SanityClient,
  file: File,
  options?: UploadOptions,
): Observable<UploadProgressEvent> {
  const upload$ = uploadImageAsset(client, file, options).pipe(
    filter((event: any) => event.stage !== 'download'),
    map((event) => ({
      ...event,
      progress: 2 + (event.percent / 100) * 98,
    })),

    map((event) => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress']),
          set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
        ])
      }
      return createUploadEvent([
        set(event.percent, [UPLOAD_STATUS_KEY, 'progress']),
        set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
      ])
    }),
  )

  const setPreviewUrl$ = readExif(file).pipe(
    mergeMap((exifData: unknown) =>
      rotateImage(file, (exifData as Exif).orientation || DEFAULT_ORIENTATION),
    ),
    catchError((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        'Image preprocessing failed for "%s" with the error: %s',
        file.name,
        error.message,
      )

      // something went wrong, but continue still
      return of(null)
    }),
    filter(Boolean),
    map((imageUrl) => createUploadEvent([set(imageUrl, [UPLOAD_STATUS_KEY, 'previewImage'])])),
  )

  return concat(
    of(createInitialUploadEvent(file)),
    merge(upload$, setPreviewUrl$),
    of(CLEANUP_EVENT),
  )
}
