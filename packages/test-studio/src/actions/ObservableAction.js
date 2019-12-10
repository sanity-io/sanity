import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {useObservable} from '@sanity/react-hooks'
import {timer} from 'rxjs'
import {map} from 'rxjs/operators'
import {createAction} from 'part:@sanity/base/util/document-action-utils'

export default createAction(function ObservableAction(docInfo) {
  return useObservable(
    timer(0, 1000).pipe(
      map(n => ({
        label: n % 2 === 0 ? 'Tick' : 'Tack'
      }))
    )
  )
})
