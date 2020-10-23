import {
  distinctUntilChanged,
  map,
  mapTo,
  mergeMap,
  publishReplay,
  refCount,
  scan,
  switchMap,
} from 'rxjs/operators'
import {concat, from, Observable, of, timer} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {editState} from './editState'

type Marker = any

function getValidationMarkers(draft, published): Observable<Marker[]> {
  const doc = draft || published
  if (!doc || !doc._type) {
    return of([])
  }
  return from(validateDocument(doc, schema) as Promise<Marker[]>)
}

export interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL_VALIDATION_STATUS: ValidationStatus = {isValidating: true, markers: []}
function validateEditState(editState) {
  return getValidationMarkers(editState.draft, editState.published).pipe(
    map((markers) => ({
      markers,
    }))
  )
}

export const validation = memoize(
  (idPair: IdPair, typeName: string) => {
    return concat(
      of(INITIAL_VALIDATION_STATUS),
      editState(idPair, typeName).pipe(
        switchMap((editState) =>
          concat<Partial<ValidationStatus>>(
            of({isValidating: true}),
            timer(300).pipe(mapTo(editState), mergeMap(validateEditState)),
            of({isValidating: false})
          )
        ),
        distinctUntilChanged(
          (prev, next) => prev.isValidating === next.isValidating && prev.markers === prev.markers
        ),
        scan(
          (prev, validationStatus) => ({...prev, ...validationStatus}),
          INITIAL_VALIDATION_STATUS
        )
      )
    ).pipe(publishReplay(1), refCount())
  },
  (idPair) => idPair.publishedId
)
