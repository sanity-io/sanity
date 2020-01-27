import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {switchMap, distinctUntilChanged} from 'rxjs/operators'

export function useEditState(publishedId, typeName) {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(({publishedId, typeName}) => documentStore.pair.editState(publishedId, typeName))
      )
    )
  )
}
