import {type SanityClient} from '@sanity/client'
import {
  isGlobalDocumentReference,
  isReference,
  type SanityDocument,
  type Schema,
  type ValidationMarker,
  type CurrentUser,
} from '@sanity/types'
import {withReleaseReferences} from '@sanity/validation'
import {evaluateDocumentObservable, type ValidationScheduling} from '@sanity/validation/_internal'
import {reduce as reduceJSON} from 'json-reduce'
import {
  asyncScheduler,
  type BehaviorSubject,
  combineLatest,
  concat,
  defer,
  from,
  lastValueFrom,
  type Observable,
  of,
  timer,
} from 'rxjs'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
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

import {type SourceClientOptions} from '../config/types'
import {type LocaleSource} from '../i18n/types'
import {type DocumentPreviewStore} from '../preview/documentPreviewStore'
import {getVersionFromId, getVersionId} from '../util/draftUtils'
import {shallowEquals} from '../util/shallowEquals'

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
      if (isReference(node) && !isGlobalDocumentReference(node)) {
        acc.add(node._ref)
      }
      return acc
    },
    new Set<string>(),
  )
}

const EMPTY_VALIDATION: ValidationMarker[] = []

interface DocumentExistence {
  exists: boolean
  unpublished: boolean
}

/**
 * Listens to the published document and, for release documents, its version in the same release.
 * Emits an entry per document ID so `withReleaseReferences` can decide what the reference resolves to.
 */
const listenDocumentExistence = (
  observeDocumentAvailability: DocumentPreviewStore['unstable_observeDocumentPairAvailability'],
  id: string,
  releaseName: string | undefined,
): Observable<[string, DocumentExistence][]> =>
  observeDocumentAvailability(id, {version: releaseName}).pipe(
    map(({published, version}) => {
      const entries: [string, DocumentExistence][] = [
        [id, {exists: published.available, unpublished: false}],
      ]
      if (releaseName && version) {
        const unpublished = version.reason === 'VERSION_DELETED'
        entries.push([
          getVersionId(id, releaseName),
          {exists: version.available || unpublished, unpublished},
        ])
      }
      return entries
    }),
  )

// throttle delay for referenced document updates (i.e. time between responding to changes in referenced documents)
const REF_UPDATE_DELAY = 1000

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

/**
 * @internal
 * Takes an observable of a document and validates it, including any references in the document.
 *
 * `scheduling` paces every run (see `ValidationScheduling`), `idle` when omitted. It can change
 * while a run is in flight, and that run follows it: a switch to `immediate` speeds it up rather
 * than starting it over.
 * */
export function validateDocumentWithReferences(
  ctx: {
    getClient: (options: SourceClientOptions) => SanityClient
    observeDocumentPairAvailability: DocumentPreviewStore['unstable_observeDocumentPairAvailability']
    schema: Schema
    i18n: LocaleSource
    currentUser?: Omit<CurrentUser, 'role'> | null
  },
  document$: Observable<SanityDocument | null | undefined>,
  scheduling?: BehaviorSubject<ValidationScheduling>,
): Observable<ValidationStatus> {
  const referenceIds$ = document$.pipe(
    map((document) => findReferenceIds(document)),
    mergeMap((ids) => from(ids)),
  )

  const versionId$ = document$.pipe(distinctUntilChanged())

  // Note: we only use this to trigger a re-run of validation when a referenced document is published/unpublished
  const referenceExistence$ = combineLatest([versionId$, referenceIds$]).pipe(
    groupBy(([_, referenceId]) => referenceId, {duration: () => timer(1000 * 60 * 30)}),
    mergeMap((refIds$) =>
      refIds$.pipe(
        distinct(),
        // release documents may reference documents in the same release, so listen to those too
        mergeMap(([document, referenceId]) =>
          listenDocumentExistence(
            ctx.observeDocumentPairAvailability,
            referenceId,
            getVersionFromId(document?._id || ''),
          ),
        ),
      ),
    ),
    scan((acc: Record<string, DocumentExistence>, entries) => {
      const changed = entries.filter(
        ([id, {exists, unpublished}]) =>
          acc[id]?.exists !== exists || acc[id]?.unpublished !== unpublished,
      )
      return changed.length === 0 ? acc : {...acc, ...Object.fromEntries(changed)}
    }, {}),
    distinctUntilChanged(shallowEquals),
    shareLatestWithRefCount(),
  )

  const getDocumentExistence = (id: string) =>
    lastValueFrom(
      referenceExistence$.pipe(
        // If the id is not present as key in the `referenceExistence` map it means it's existence status
        // isn't yet loaded, so we want to wait until it is
        first((referenceExistence) => id in referenceExistence),
        map((referenceExistence) => referenceExistence[id]),
      ),
    )

  // Provided to individual validation functions to support using existence of a weakly referenced document
  // as part of the validation rule (used by references in place)
  const getDocumentExists = (documentId: string) =>
    withReleaseReferences({
      documentId,
      getDocumentExists: ({id}) => getDocumentExistence(id).then(({exists}) => exists),
      isUnpublished: ({id}) => getDocumentExistence(id).then(({unpublished}) => unpublished),
    })

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
          evaluateDocumentObservable({
            document,
            getClient: ctx.getClient,
            getDocumentExists: getDocumentExists(document._id),
            i18n: ctx.i18n,
            schema: ctx.schema,
            environment: 'studio',
            currentUser: ctx.currentUser,
            scheduling,
          }).pipe(map((result) => ({validation: result.markers, isValidating: false}))),
        )
      })
    }),
    scan((acc, next) => ({...acc, ...next}), INITIAL_VALIDATION_STATUS),
    shareLatestWithRefCount(),
  )
}
