import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {switchMap} from 'rxjs/operators'

export function useEditState(publishedId, typeName) {
  return useObservable(
    toObservable([publishedId, typeName], props$ =>
      props$.pipe(
        switchMap(([publishedId, typeName]) =>
          documentStore.local.editStateOf(publishedId, typeName)
        )
      )
    )
  )
}
