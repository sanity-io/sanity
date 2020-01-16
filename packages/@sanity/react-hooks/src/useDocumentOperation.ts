import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {distinctUntilChanged, switchMap} from 'rxjs/operators'

export function useDocumentOperation(publishedId, typeName) {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged(
          (curr, next) => curr.publishedId === next.publishedId && curr.typeName === next.typeName
        ),
        switchMap(({publishedId, typeName}) => documentStore.local.editOpsOf(publishedId, typeName))
      )
    )
  )
}
