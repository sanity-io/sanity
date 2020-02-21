import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {switchMap, distinctUntilChanged} from 'rxjs/operators'
import {Observable} from 'rxjs'

interface Marker {
  level: string
  type: string
}

interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL: ValidationStatus = {markers: [], isValidating: false}

export function useValidationStatus(publishedId, typeName): ValidationStatus {
  return useObservable(
    toObservable({publishedId, typeName}, props$ =>
      props$.pipe(
        distinctUntilChanged((curr, next) => curr.publishedId === next.publishedId),
        switchMap(
          ({publishedId, typeName}): Observable<ValidationStatus> =>
            documentStore.pair.validation(publishedId, typeName)
        )
      )
    ),
    INITIAL
  )
}
