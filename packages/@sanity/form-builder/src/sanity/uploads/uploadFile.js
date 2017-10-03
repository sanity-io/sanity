// @flow
import Observable from '@sanity/observable'
import {uploadFile} from '../inputs/client-adapters/assets'
import {set, unset} from '../../utils/patches'
import type {ObservableI} from './typedefs/observable'
import type {UploadEvent} from './typedefs'

const SET_UPLOAD_PATCH = set({
  percent: 0,
}, ['_import'])

export default function importFile(file: File) : ObservableI<UploadEvent> {
  return Observable.of({patches: SET_UPLOAD_PATCH})
    .merge(
      uploadFile(file)
        .map(event => {
          if (event.type === 'complete') {
            return {
              patches: [
                unset(['_import']),
                set({_type: 'reference', _ref: event.asset._id}, ['asset'])
              ]
            }
          }
          return {
            patches: [set(event.percent, ['_import', 'percent'])]
          }
        })
    )

}
