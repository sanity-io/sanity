import {
  isReference,
  type SanityDocument,
  type Schema,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {reduce as reduceJSON} from 'json-reduce'
import {
  asyncScheduler,
  combineLatest,
  concat,
  defer,
  lastValueFrom,
  type Observable,
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
  scan,
  shareReplay,
  skip,
  throttleTime,
} from 'rxjs/operators'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {
  type DraftsModelDocumentAvailability,
  type LocaleSource,
  type SanityClient,
  type SourceClientOptions,
} from 'sanity'
import shallowEquals from 'shallow-equals'

import {validateDocumentObservable} from '../../../validation/validateDocument'

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

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

export const documentValidation = (
  ctx: {
    observeDocumentPairAvailability: ObserveDocumentPairAvailability
    getClient: (options: SourceClientOptions) => SanityClient
    schema: Schema
    i18n: LocaleSource
  },
  document$: Observable<SanityDocument | null>,
) => {
  const referenceIds$ = document$.pipe(map((document) => [...findReferenceIds(document)]))
  // Note: we only use this to trigger a re-run of validation when a referenced document is published/unpublished
  // Note: we only use this to trigger a re-run of validation when a referenced document is published/unpublished
  const referenceExistence$ = referenceIds$.pipe(
    groupBy((id) => id, {duration: () => timer(1000 * 60 * 30)}),
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
      if (acc[id] === result) {
        return acc
      }
      return {...acc, [id]: result}
    }, {}),
    distinctUntilChanged(shallowEquals),
    shareLatestWithRefCount(),
  )

  // Provided to individual validation functions to support using existence of a weakly referenced document
  // as part of the validation rule (used by references in place)
  const getDocumentExists: GetDocumentExists = ({id}) =>
    lastValueFrom(
      referenceExistence$.pipe(
        // If the id is not present as key in the `referenceExistence` map it means it's existence status
        // isn't yet loaded, so we want to wait until it is
        first((referenceExistence) => id in referenceExistence),
        map((referenceExistence) => referenceExistence[id]),
      ),
    )

  const referenceDocumentUpdates$ = referenceExistence$.pipe(
    // we'll skip the first emission since the document already gets an initial validation pass
    // we're only interested in updates in referenced documents after that
    skip(1),
    throttleTime(REF_UPDATE_DELAY, asyncScheduler, {leading: true, trailing: true}),
  )

  const validationStatusObservable = combineLatest([
    document$,
    concat(of(null), referenceDocumentUpdates$),
  ]).pipe(
    map(([document]) => document),
    distinctUntilChanged((prev, curr) => {
      return prev?._rev === curr?._rev
    }),
    exhaustMapWithTrailing((document) => {
      return defer(() => {
        if (!document?._type) {
          return of({validation: EMPTY_VALIDATION, isValidating: false, documentId: document?._id})
        }
        return concat(
          of({isValidating: true, revision: document._rev}),
          validateDocumentObservable({
            document,
            getClient: ctx.getClient,
            getDocumentExists,
            i18n: ctx.i18n,
            schema: ctx.schema,
            environment: 'studio',
          }).pipe(
            map((validationMarkers) => ({
              validation: validationMarkers,
              isValidating: false,
              documentId: document?._id,
            })),
          ),
        )
      })
    }),
    scan((acc, next) => ({...acc, ...next}), INITIAL_VALIDATION_STATUS),
    shareLatestWithRefCount(),
  )

  return validationStatusObservable
}

const MEMO = new Map<string, Observable<ValidationStatus>>()

function getDocumentValidation(id: string, producer: () => Observable<ValidationStatus>) {
  if (!MEMO.has(id)) {
    MEMO.set(id, producer())
  }
  return MEMO.get(id)
}

export const documentsValidation = (
  ctx: {
    observeDocumentPairAvailability: ObserveDocumentPairAvailability
    observeDocument: (id: string) => Observable<SanityDocument>
    getClient: (options: SourceClientOptions) => SanityClient
    schema: Schema
    i18n: LocaleSource
  },
  documentIds$: Observable<string[]>,
) => {
  const validations = documentIds$.pipe(
    mergeMap((ids) => {
      const validations = ids.map((id) =>
        getDocumentValidation(id, () =>
          ctx.observeDocument(id).pipe(mergeMap((doc) => documentValidation(ctx, document$))),
        ),
      )
      return combineLatest(validations)
    }),
  )
  const combinedObservables = combineLatest(validations.map((v) => v)).pipe(
    shareLatestWithRefCount(),
  )

  return {
    observable: combinedObservables,
  }
}
