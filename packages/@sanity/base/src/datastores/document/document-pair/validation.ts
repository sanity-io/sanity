// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {
  map,
  scan,
  switchMap,
  mergeMap,
  publishReplay,
  refCount,
  share,
  distinctUntilChanged,
  debounceTime,
  first,
  throttleTime,
} from 'rxjs/operators'

import {concat, of, combineLatest, defer, from, Observable, asyncScheduler} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'
import {Marker, ValidationContext, isReference} from '@sanity/types'
import reduceJSON from 'json-reduce'
import shallowEquals from 'shallow-equals'
import {omit} from 'lodash'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {observeDocumentPairAvailability} from '../../../preview/availability'
import {editState} from './editState'

export interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}

const INITIAL_VALIDATION_STATUS: ValidationStatus = {isValidating: true, markers: []}

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

const getDocumentExists: GetDocumentExists = ({id}) =>
  listenDocumentExists(id).pipe(first()).toPromise()

// debounce delay for document updates (i.e. how long we wait before responding to changes in the document)
const DOC_UPDATE_DELAY = 1000

// debounce delay for referenced document updates (i.e. how long we wait before responding to changes in referenced documents
const REF_UPDATE_DELAY = 1000

// debounce delay for re-running validation either as a response to document updates or referenced document updates
// e.g. we will only re-run validation if document edits and referenced documents has been "quiet" for this period of time
// Note: this means validation will first be triggered at MAX(DOC_UPDATE_DELAY, REF_UPDATE_DELAY) + RERUN_VALIDATION_DELAY
const RERUN_VALIDATION_DELAY = 1000

export const validation = memoize(
  ({draftId, publishedId}: IdPair, typeName: string) => {
    const document$ = editState({draftId, publishedId}, typeName).pipe(
      map(({draft, published}) => draft || published),
      debounceTime(DOC_UPDATE_DELAY),
      distinctUntilChanged((prev, next) =>
        // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
        // so only pass on documents if _other_ attributes changes
        shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
      ),
      share()
    )

    const referenceIds$ = document$.pipe(
      map((document) => findReferenceIds(document)),
      distinctUntilChanged((curr, next) => {
        if (curr.size !== next.size) return false
        for (const item of curr) {
          if (!next.has(item)) return false
        }
        return true
      })
    )

    const referencedDocumentUpdate$ = referenceIds$.pipe(
      switchMap((idSet) =>
        from(idSet).pipe(
          mergeMap((id) =>
            listenDocumentExists(id).pipe(
              map(
                // eslint-disable-next-line max-nested-callbacks
                (result) => [id, result] as const
              )
            )
          ),
          // the `debounceTime` in the next stream removes multiple emissions
          // caused by this scan
          scan(
            (acc, [id, result]) => ({
              ...acc,
              [id]: result,
            }),
            {} as Record<string, boolean>
          )
        )
      ),
      debounceTime(REF_UPDATE_DELAY),
      distinctUntilChanged((curr, next) => {
        const currKeys = Object.keys(curr)
        const nextKeys = Object.keys(next)
        if (currKeys.length !== nextKeys.length) return false
        for (const key of currKeys) {
          if (curr[key] !== next[key]) return false
        }
        return true
      })
    )

    return combineLatest([
      // from document edits
      document$,
      // and from document dependency events
      concat(
        // note: that the `referencedDocumentUpdate$` may not pre-emit any
        // events (unlike `editState` which includes `publishReplay(1)`), so
        // we `concat` the stream with an empty emission so `combineLatest` will
        // emit as soon as `editState` emits
        //
        // > Be aware that `combineLatest` will not emit an initial value until
        // > each observable emits at least one value.
        // https://www.learnrxjs.io/learn-rxjs/operators/combination/combinelatest#why-use-combinelatest
        of(null),
        referencedDocumentUpdate$
      ),
    ]).pipe(
      map(
        ([
          document,
          // ignoring this as we merely want to re-run validation as a response to an update in a referenced document
          referencedDocumentUpdate,
        ]) => document
      ),
      // if referenced documents happens to update quite frequent and local document
      // debounce delay hits about the same time, this will prevent us from running actual validation too often
      debounceTime(RERUN_VALIDATION_DELAY),
      switchMap((document) =>
        concat(
          of({isValidating: true}),
          defer(async () => {
            if (!document?._type) {
              return {markers: EMPTY_ARRAY, isValidating: false}
            }

            // TODO: consider cancellation eventually
            const markers = await validateDocument(document, schema, {getDocumentExists})

            return {markers, isValidating: false}
          })
        )
      ),
      scan((acc, next) => ({...acc, ...next}), INITIAL_VALIDATION_STATUS),
      publishReplay(1),
      refCount()
    )
  },
  (idPair) => idPair.publishedId
)
