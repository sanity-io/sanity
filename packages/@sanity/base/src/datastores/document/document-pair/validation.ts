import {debounceTime, map, scan, switchMap, publishReplay, refCount} from 'rxjs/operators'
import {concat, from, Observable, of} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'
import {createMemoizer} from '../utils/createMemoizer'
import {editState} from './editState'
import {IdPair} from '../types'

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

const cacheOn = createMemoizer<ValidationStatus>()

export function validation(idPair: IdPair, typeName: string) {
  return concat(
    of(INITIAL_VALIDATION_STATUS),
    editState(idPair, typeName).pipe(
      debounceTime(300),
      switchMap(editState =>
        concat(
          of({isValidating: true}),
          getValidationMarkers(editState.draft, editState.published).pipe(
            map(markers => ({
              markers,
              isValidating: false
            }))
          )
        )
      ),
      scan((prev, validationStatus) => ({...prev, ...validationStatus}), INITIAL_VALIDATION_STATUS),
      publishReplay(1),
      refCount(),
      cacheOn(idPair.publishedId)
    )
  )
}
