/* eslint-disable max-nested-callbacks */
// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {
  distinct,
  distinctUntilChanged,
  first,
  groupBy,
  map,
  mergeMap,
  publishReplay,
  refCount,
  scan,
  share,
  shareReplay,
  skip,
  throttleTime,
} from 'rxjs/operators'

import {asyncScheduler, combineLatest, concat, defer, from, Observable, of, timer} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocumentObservable} from '@sanity/validation'
import {isReference, Marker, ValidationContext} from '@sanity/types'
import reduceJSON from 'json-reduce'
import shallowEquals from 'shallow-equals'
import {omit} from 'lodash'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {observeDocumentPairAvailability} from '../../../preview/availability'
import {editState} from './editState'

export interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
  revision: string
}

const INITIAL_VALIDATION_STATUS: ValidationStatus = {
  isValidating: true,
  markers: [],
  revision: null,
}

function findReferenceIds(obj: any): Set<string> {
  return reduceJSON(
    obj,
    (acc, node) => {
      if (isReference(node)) {
        acc.add(node._ref)
      }
      return acc
    },
    new Set<string>()
  )
}

const EMPTY_ARRAY = []
type GetDocumentExists = NonNullable<ValidationContext['getDocumentExists']>

const listenDocumentExists = (id: string): Observable<boolean> =>
  observeDocumentPairAvailability(id).pipe(map(({published}) => published.available))

// throttle delay for document updates (i.e. time between responding to changes in the current document)
const DOC_UPDATE_DELAY = 200

// throttle delay for referenced document updates (i.e. time between responding to changes in referenced documents)
const REF_UPDATE_DELAY = 1000

export const validation = memoize(
  ({draftId, publishedId}: IdPair, typeName: string) => {
    const document$ = editState({draftId, publishedId}, typeName).pipe(
      map(({draft, published}) => draft || published),
      throttleTime(DOC_UPDATE_DELAY, asyncScheduler, {trailing: true}),
      distinctUntilChanged((prev, next) => {
        if (prev?._rev === next?._rev) {
          return true
        }
        // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
        // so only pass on documents if _other_ attributes changes
        return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
      }),
      share()
    )

    const referenceIds$ = document$.pipe(
      map((document) => findReferenceIds(document)),
      mergeMap((ids) => from(ids))
    )

    // Note: we only use this to trigger a re-run of validation when a referenced document is published/unpublished
    const referenceExistence$ = referenceIds$.pipe(
      groupBy(
        (id) => id,
        null,
        () => timer(1000 * 60 * 30)
      ),
      mergeMap((id$) =>
        id$.pipe(
          distinct(),
          mergeMap((id) =>
            listenDocumentExists(id).pipe(
              map(
                // eslint-disable-next-line max-nested-callbacks
                (result) => [id, result] as const
              )
            )
          )
        )
      ),
      scan((acc: Record<string, boolean>, [id, result]) => {
        if (Boolean(acc[id]) === result) {
          return acc
        }
        return result ? {...acc, [id]: result} : omit(acc, id)
      }, {}),
      distinctUntilChanged(shallowEquals),
      shareReplay({refCount: true, bufferSize: 1})
    )

    // Provided to individual validation functions to support using existence of a weakly referenced document
    // as part of the validation rule (used by references in place)
    const getDocumentExists: GetDocumentExists = ({id}) =>
      referenceExistence$
        .pipe(
          first(),
          map((referenceExistence) => referenceExistence[id])
        )
        .toPromise()

    const referenceDocumentUpdates$ = referenceExistence$.pipe(
      // we'll skip the first emission since the document already gets an initial validation pass
      // we're only interested in updates in referenced documents after that
      skip(1),
      throttleTime(REF_UPDATE_DELAY, asyncScheduler, {leading: true, trailing: true})
    )

    return combineLatest([document$, concat(of(null), referenceDocumentUpdates$)]).pipe(
      map(([document]) => document),
      exhaustMapWithTrailing((document) => {
        return defer(() => {
          if (!document?._type) {
            return of({markers: EMPTY_ARRAY, isValidating: false})
          }
          return concat(
            of({isValidating: true, revision: document._rev}),
            validateDocumentObservable(document, schema, {getDocumentExists}).pipe(
              map((markers) => ({markers, isValidating: false}))
            )
          )
        })
      }),
      scan((acc, next) => ({...acc, ...next}), INITIAL_VALIDATION_STATUS),
      publishReplay(1),
      refCount()
    )
  },
  (idPair) => idPair.publishedId
)
