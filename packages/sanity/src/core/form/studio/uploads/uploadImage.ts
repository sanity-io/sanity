import {from as observableFrom, of as observableOf, Observable} from 'rxjs'
import {catchError, concat, filter, map, merge, mergeMap} from 'rxjs/operators'
import type {SanityClient} from '@sanity/client'
import {set} from '../../patch'
import {uploadImageAsset} from '../inputs/client-adapters/assets'
import {readExif} from './image/readExif'
import {rotateImage} from './image/rotateImage'
import {DEFAULT_ORIENTATION, Orientation} from './image/orient'
import {UploadEvent, UploadOptions} from './types'
import {UPLOAD_STATUS_KEY} from './constants'
import {CLEANUP_EVENT, createInitialUploadEvent, createUploadEvent} from './utils'

type Exif = {
  orientation: Orientation
}

export function uploadImage(
  client: SanityClient,
  file: File,
  options?: UploadOptions
): Observable<UploadEvent> {
  const upload$ = uploadImageAsset(client, file, options).pipe(
    filter((event: any) => event.stage !== 'download'),
    map((event) => ({
      ...event,
      progress: 2 + (event.percent / 100) * 98,
    })),

    map((event: any) => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress']),
          set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updated']),
        ])
      }
      return createUploadEvent([
        set(event.percent, [UPLOAD_STATUS_KEY, 'progress']),
        set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updated']),
      ])
    })
  )

  const setPreviewUrl$ = readExif(file).pipe(
    mergeMap((exifData: unknown) =>
      rotateImage(file, (exifData as Exif).orientation || DEFAULT_ORIENTATION)
    ),

    catchError((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        'Image preprocessing failed for "%s" with the error: %s',
        file.name,
        error.message
      )

      // something went wrong, but continue still
      return observableOf(null)
    }),
    filter(Boolean),
    map((imageUrl) => createUploadEvent([set(imageUrl, [UPLOAD_STATUS_KEY, 'previewImage'])]))
  )

  return observableOf(createInitialUploadEvent(file)).pipe(
    concat(observableFrom(upload$).pipe(merge(setPreviewUrl$))),
    concat(observableOf(CLEANUP_EVENT))
  )
}
