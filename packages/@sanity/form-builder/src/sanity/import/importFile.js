// @flow
import Observable from '@sanity/observable'
import {uploadFile} from '../inputs/client-adapters/assets'
import {set, unset} from '../../utils/patches'

const SET_IMPORT_PATCH = set({
  percent: 0,
}, ['_import'])

export default function importFile(file: File) {
  return Observable.of({patches: SET_IMPORT_PATCH})
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
