import documentStore from 'part:@sanity/base/datastore/document'
import {toObservable, useObservable} from './utils/use-observable'
import {map, switchMap} from 'rxjs/operators'
import {validateDocument} from '@sanity/validation'
import {concat, from, Observable, of} from 'rxjs'
import schema from 'part:@sanity/base/schema'

type Marker = any

function getValidationMarkers(draft, published): Observable<Marker[]> {
  const doc = draft || published
  if (!doc || !doc._type) {
    return of([])
  }
  return from(validateDocument(doc, schema) as Promise<Marker[]>)
}

interface ValidationStatus {
  isValidating: boolean
  errors: Marker[]
}

const INITIAL_VALIDATION_STATUS = {isValidating: true, errors: []}

export function useValidationStatus(publishedId, typeName): ValidationStatus {
  return useObservable(
    toObservable([publishedId, typeName], props$ =>
      props$.pipe(
        switchMap(
          ([publishedId, typeName]): Observable<{draft: {}; published: {}}> =>
            documentStore.local.editStateOf(publishedId, typeName)
        ),
        switchMap(editState =>
          concat(
            of(INITIAL_VALIDATION_STATUS),
            getValidationMarkers(editState.draft, editState.published).pipe(
              map(markers => ({
                errors: markers,
                isValidating: false
              }))
            )
          )
        )
      )
    ),
    INITIAL_VALIDATION_STATUS
  )
}
