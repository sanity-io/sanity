import documentStore from 'part:@sanity/base/datastore/document'
import {switchMap, distinctUntilChanged} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

export function useEditState(publishedId: string, typeName: string) {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(({publishedId: publishedDocId, typeName: docTypeName}) =>
          documentStore.pair.editState(publishedDocId, docTypeName)
        )
      )
    )
  )
}
