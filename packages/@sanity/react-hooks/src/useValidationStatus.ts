import documentStore from 'part:@sanity/base/datastore/document'
import {Observable} from 'rxjs'
import {switchMap, distinctUntilChanged} from 'rxjs/operators'
import {toObservable, useObservable} from './utils/useObservable'

interface Marker {
  level: string
  type: string
}

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedId: string, typeName: string): ValidationStatus {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(
          ({publishedId: publishedDocId, typeName: docTypeName}): Observable<ValidationStatus> =>
            documentStore.pair.validation(publishedDocId, docTypeName)
        )
      )
    ),
    INITIAL
  )
}
