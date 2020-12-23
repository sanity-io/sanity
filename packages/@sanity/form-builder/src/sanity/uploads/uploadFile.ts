import {of as observableOf, Observable} from 'rxjs'
import {map, concat} from 'rxjs/operators'
import {uploadFileAsset} from '../inputs/client-adapters/assets'
import {set} from '../../patch/patches'
import {UploadEvent, UploadOptions} from './types'
import {UPLOAD_STATUS_KEY} from './constants'
import {createUploadEvent, createInitialUploadEvent, CLEANUP_EVENT} from './utils'

export default function uploadFile(file: File, options?: UploadOptions): Observable<UploadEvent> {
  const upload$ = uploadFileAsset(file, options).pipe(
    map((event: any) => {
      if (event.type === 'complete') {
        return createUploadEvent([
          set({_type: 'reference', _ref: event.asset._id}, ['asset']),
          set(100, [UPLOAD_STATUS_KEY, 'progress']),
        ])
      }
      return createUploadEvent([set(event.percent, [UPLOAD_STATUS_KEY, 'progress'])])
    })
  )

  return observableOf(createInitialUploadEvent(file)).pipe(
    concat(upload$),
    concat(observableOf(CLEANUP_EVENT))
  )
}
