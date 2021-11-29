// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

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
import type {Observable} from 'rxjs'
import {concat, from, of, timer} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'
import type {Marker} from '@sanity/types'
import {memoize} from '../utils/createMemoizer'
import type {IdPair} from '../types'
import type {EditStateFor} from './editState'
import {editState} from './editState'

function getValidationMarkers(draft, published): Observable<Marker[]> {
  const doc = draft || published
  if (!doc || !doc._type) {
    return of([])
  }
  return from(validateDocument(doc, schema))
}

export interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL_VALIDATION_STATUS: ValidationStatus = {isValidating: true, markers: []}
function validateEditState(_editState: EditStateFor) {
  return getValidationMarkers(_editState.draft, _editState.published).pipe(
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
        switchMap((_editState) =>
          concat<Partial<ValidationStatus>>(
            of({isValidating: true}),
            timer(300).pipe(mapTo(_editState), mergeMap(validateEditState)),
            of({isValidating: false})
          )
        ),
        scan((prev, next) => ({...prev, ...next}), INITIAL_VALIDATION_STATUS),
        distinctUntilChanged(
          (prev, next) => prev.isValidating === next.isValidating && prev.markers === next.markers
        )
      )
    ).pipe(publishReplay(1), refCount())
  },
  (idPair) => idPair.publishedId
)
