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
} from 'rxjs/operators'

import {concat, of, combineLatest, defer, from, Observable} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'
import {Marker, ValidationContext, isReference} from '@sanity/types'
import reduceJSON from 'json-reduce'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {observePaths} from '../../../preview'
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

type GetDocumentExists = NonNullable<ValidationContext['getDocumentExists']>

const listenDocumentExists = (id: string): Observable<boolean> =>
  observePaths(id, ['_rev']).pipe(map((snapshot) => Boolean(snapshot?._rev)))

const getDocumentExists: GetDocumentExists = ({id}) =>
  listenDocumentExists(id).pipe(first()).toPromise()

export const validation = memoize(
  ({draftId, publishedId}: IdPair, typeName: string) => {
    const document$ = editState({draftId, publishedId}, typeName).pipe(
      map(({draft, published}) => draft || published),
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
      ).pipe(
        // don't remove, see `debounceTime` comment above
        debounceTime(50)
      ),
    ]).pipe(
      map(([document]) => document),
      switchMap((document) =>
        concat(
          of({isValidating: true}),
          defer(async () => {
            if (!document?._type) {
              return {markers: [], isValidating: false}
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
