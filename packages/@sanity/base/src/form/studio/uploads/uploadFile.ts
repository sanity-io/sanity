import {of as observableOf, Observable} from 'rxjs'
import {map, concat} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {set} from '../../patch'
import {uploadFileAsset} from '../inputs/client-adapters/assets'
import {UploadEvent, UploadOptions} from './types'
import {UPLOAD_STATUS_KEY} from './constants'
import {createUploadEvent, createInitialUploadEvent, CLEANUP_EVENT} from './utils'

export function uploadFile(
  client: SanityClient,
  file: File,
  options?: UploadOptions
): Observable<UploadEvent> {
  const upload$ = uploadFileAsset(client, file, options).pipe(
    map((event) => {
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

  return observableOf(createInitialUploadEvent(file)).pipe(
    concat(upload$),
    concat(observableOf(CLEANUP_EVENT))
  )
}
