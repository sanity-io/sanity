import type {SanityClient} from '@sanity/client'
import {
  asyncScheduler,
  combineLatest,
  concat,
  defer,
  from,
  lastValueFrom,
  Observable,
  of,
  timer,
} from 'rxjs'
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
import {isReference, Schema, ValidationContext, ValidationMarker} from '@sanity/types'
import {reduce as reduceJSON} from 'json-reduce'
import shallowEquals from 'shallow-equals'
import {omit} from 'lodash'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {validateDocumentObservable} from '../../../../validation'
import {SourceClientOptions} from '../../../../config'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {DraftsModelDocumentAvailability} from '../../../../preview'
import {editState} from './editState'

/**
 * @hidden
 * @beta */
export interface ValidationStatus {
  isValidating: boolean
  validation: ValidationMarker[]
  revision?: string
}

const INITIAL_VALIDATION_STATUS: ValidationStatus = {
  isValidating: true,
  validation: [],
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
    new Set<string>(),
  )
}

const EMPTY_VALIDATION: ValidationMarker[] = []

type GetDocumentExists = NonNullable<ValidationContext['getDocumentExists']>

type ObserveDocumentPairAvailability = (id: string) => Observable<DraftsModelDocumentAvailability>

const listenDocumentExists = (
  observeDocumentAvailability: ObserveDocumentPairAvailability,
  id: string,
): Observable<boolean> =>
  observeDocumentAvailability(id).pipe(map(({published}) => published.available))

// throttle delay for document updates (i.e. time between responding to changes in the current document)
const DOC_UPDATE_DELAY = 200

// throttle delay for referenced document updates (i.e. time between responding to changes in referenced documents)
const REF_UPDATE_DELAY = 1000

/** @internal */
export const validation = memoize(
  (
    ctx: {
      client: SanityClient
      getClient: (options: SourceClientOptions) => SanityClient
      observeDocumentPairAvailability: ObserveDocumentPairAvailability
      schema: Schema
    },
    {draftId, publishedId}: IdPair,
    typeName: string,
  ): Observable<ValidationStatus> => {
    const document$ = editState(ctx, {draftId, publishedId}, typeName).pipe(
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
      share(),
    )

    const referenceIds$ = document$.pipe(
      map((document) => findReferenceIds(document)),
      mergeMap((ids) => from(ids)),
    )

    // Note: we only use this to trigger a re-run of validation when a referenced document is published/unpublished
    const referenceExistence$ = referenceIds$.pipe(
      groupBy(
        (id) => id,
        undefined,
        () => timer(1000 * 60 * 30),
      ),
      mergeMap((id$) =>
        id$.pipe(
          distinct(),
          mergeMap((id) =>
            listenDocumentExists(ctx.observeDocumentPairAvailability, id).pipe(
              map(
                // eslint-disable-next-line max-nested-callbacks
                (result) => [id, result] as const,
              ),
            ),
          ),
        ),
      ),
      scan((acc: Record<string, boolean>, [id, result]): Record<string, boolean> => {
        if (Boolean(acc[id]) === result) {
          return acc
        }
        return result ? {...acc, [id]: result} : omit(acc, id)
      }, {}),
      distinctUntilChanged(shallowEquals),
      shareReplay({refCount: true, bufferSize: 1}),
    )

    // Provided to individual validation functions to support using existence of a weakly referenced document
    // as part of the validation rule (used by references in place)
    const getDocumentExists: GetDocumentExists = ({id}) =>
      lastValueFrom(
        referenceExistence$.pipe(
          first(),
          map((referenceExistence) => referenceExistence[id]),
        ),
      )

    const referenceDocumentUpdates$ = referenceExistence$.pipe(
      // we'll skip the first emission since the document already gets an initial validation pass
      // we're only interested in updates in referenced documents after that
      skip(1),
      throttleTime(REF_UPDATE_DELAY, asyncScheduler, {leading: true, trailing: true}),
    )

    return combineLatest([document$, concat(of(null), referenceDocumentUpdates$)]).pipe(
      map(([document]) => document),
      exhaustMapWithTrailing((document) => {
        return defer(() => {
          if (!document?._type) {
            return of({validation: EMPTY_VALIDATION, isValidating: false})
          }
          return concat(
            of({isValidating: true, revision: document._rev}),
            validateDocumentObservable(ctx.getClient, document, ctx.schema, {
              getDocumentExists,
            }).pipe(
              map((validationMarkers) => ({validation: validationMarkers, isValidating: false})),
            ),
          )
        })
      }),
      scan((acc, next) => ({...acc, ...next}), INITIAL_VALIDATION_STATUS),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => {
    const config = ctx.client.config()

    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${typeName}`
  },
)
