import documentStore from 'part:@sanity/base/datastore/document'
import {distinctUntilChanged, switchMap} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

export function useDocumentOperation(publishedId, typeName) {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(({publishedId: publishedDocId, typeName: docTypeName}) =>
          documentStore.pair.editOperations(publishedDocId, docTypeName)
        )
      )
    )
  )
}
