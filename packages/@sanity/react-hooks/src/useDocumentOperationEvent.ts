import documentStore from 'part:@sanity/base/datastore/document'
import {distinctUntilChanged, switchMap} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

export function useDocumentOperationEvent(publishedId: string, typeName: string) {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(({publishedId: publishedDocId, typeName: docTypeName}) =>
          documentStore.pair.operationEvents(publishedDocId, docTypeName)
        ),
        distinctUntilChanged()
      )
    )
  )
}
