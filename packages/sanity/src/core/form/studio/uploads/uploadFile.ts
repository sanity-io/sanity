import {type SanityClient} from '@sanity/client'
import {concat, type Observable, of} from 'rxjs'
import {map} from 'rxjs/operators'

import {set} from '../../patch'
import {uploadFileAsset} from '../inputs/client-adapters/assets'
import {UPLOAD_STATUS_KEY} from './constants'
import {type UploadOptions, type UploadProgressEvent} from './types'
import {CLEANUP_EVENT, createInitialUploadEvent, createUploadEvent} from './utils'

export function uploadFile(
  client: SanityClient,
  file: File,
  options?: UploadOptions,
): Observable<UploadProgressEvent> {
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
    }),
  )

  return concat(of(createInitialUploadEvent(file)), upload$, of(CLEANUP_EVENT))
}
