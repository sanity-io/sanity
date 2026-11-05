import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SanityDocument, type Schema} from '@sanity/types'
import {type ValidationScheduling} from '@sanity/validation/_internal'
import omit from 'lodash-es/omit.js'
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  concat,
  EMPTY,
  merge,
  Observable,
  of,
  timer,
} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  retry,
  share,
  shareReplay,
  throttleTime,
} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config/types'
import {type LocaleSource} from '../../../i18n/types'
import {type DraftsModelDocumentAvailability} from '../../../preview/types'
import {type DocumentVariantType} from '../../../util/getDocumentVariantType'
import {shallowEquals} from '../../../util/shallowEquals'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {editState} from './editState'
import {memoizeKeyGen} from './memoizeKeyGen'

// throttle delay for document updates (i.e. time between responding to changes in the current document)
const DOC_UPDATE_DELAY = 200

// Same limit as the preview store's document-count fetch. After that the load is reported, then
// tried again. The same delay is the pause before that next try.
const MAX_GLOBAL_DOCUMENT_LOAD_RETRIES = 3
const GLOBAL_DOCUMENT_LOAD_RETRY_MS = 30_000

type GlobalDocumentLoad = {document: SanityDocument | null} | {error: {message: string}}

function isGlobalDocumentLoadError(load: GlobalDocumentLoad): load is {error: {message: string}} {
  return 'error' in load
}

function documentLoadError(error: unknown): {message: string} {
  return {
    message:
      error instanceof Error && error.message
        ? error.message
        : 'Could not load the document to validate it',
  }
}

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

/**
 * Where the validated document comes from: `document` checks out the document pair, which opens a
 * listener for it, and `global` follows the document through the document preview store's shared
 * global listener.
 */
export type ValidationListener = 'document' | 'global'

function getValidationTargetId(idPair: IdPair, validationTarget: DocumentVariantType) {
  if (validationTarget === 'draft') return idPair.draftId
  if (validationTarget === 'version') return idPair.versionId
  return idPair.publishedId
}

const validationStreams = memoize(
  (
    ctx: {
      client: SanityClient
      getClient: (options: SourceClientOptions) => SanityClient
      observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
      observeDocument: (id: string) => Observable<SanityDocument | undefined>
      schema: Schema
      i18n: LocaleSource
      /**
       * @deprecated Does nothing. Preserved to avoid breaking changes.
       * Will be removed in the next major version.
       */
      serverActionsEnabled?: Observable<boolean>
      pairListenerOptions?: DocumentStoreExtraOptions
      currentUser?: Omit<CurrentUser, 'role'> | null
    },
    idPair: IdPair,
    typeName: string,
    validationTarget: DocumentVariantType,
    listener: ValidationListener,
  ) => {
    const documentId = getValidationTargetId(idPair, validationTarget)
    // Shared, so the document and its load error come from one subscription. A failed load is
    // retried, then reported as `error` with `isValidating` still true, and tried again later.
    const globalDocument$ =
      listener === 'global' && documentId
        ? ctx.observeDocument(documentId).pipe(
            retry({
              count: MAX_GLOBAL_DOCUMENT_LOAD_RETRIES,
              delay: (_error: unknown, attempt) =>
                timer(Math.min(GLOBAL_DOCUMENT_LOAD_RETRY_MS, attempt * 1000)),
            }),
            map((document): GlobalDocumentLoad => ({document: document ?? null})),
            catchError((error: unknown, caught$) =>
              concat(
                of<GlobalDocumentLoad>({error: documentLoadError(error)}),
                timer(GLOBAL_DOCUMENT_LOAD_RETRY_MS).pipe(mergeMap(() => caught$)),
              ),
            ),
            shareLatestWithRefCount(),
          )
        : undefined
    const target$: Observable<SanityDocument | null | undefined> = globalDocument$
      ? globalDocument$.pipe(
          filter(
            (load): load is {document: SanityDocument | null} => !isGlobalDocumentLoadError(load),
          ),
          map((load) => load.document),
        )
      : listener === 'global'
        ? of(undefined)
        : editState(ctx, idPair, typeName).pipe(
            map((state) => {
              const {version, draft, published} = state

              if (validationTarget === 'draft') return draft
              if (validationTarget === 'version') return version
              return published
            }),
          )
    const loadError$ = globalDocument$
      ? globalDocument$.pipe(
          filter(isGlobalDocumentLoadError),
          map((load): ValidationStatus => ({
            isValidating: true,
            validation: [],
            error: load.error,
          })),
        )
      : EMPTY
    // shared, so the document to validate and the revision below come from the same emission
    const document$ = target$.pipe(
      throttleTime(DOC_UPDATE_DELAY, asyncScheduler, {trailing: true}),
      shareLatestWithRefCount(),
    )

    const documentToValidate$ = document$.pipe(
      distinctUntilChanged((prev, next) => {
        if (prev?._rev === next?._rev) {
          return true
        }
        // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
        // so only pass on documents if _other_ attributes changes
        return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
      }),
      shareLatestWithRefCount(),
    )

    /**
     * When a local mutation is applied, the document content updates immediately
     * but the `_rev` stays the same. When the server later confirms the
     * mutation, a new `_rev` arrives, but since the content hasn't changed (it was
     * already applied), `documentToValidate$` correctly skips re-validation due to
     * the `shallowEquals` check above.
     *
     * However, the `revision` field exposed in `ValidationStatus` must still reflect
     * the latest `_rev` from the server. If it doesn't, consumers that compare
     * `validationStatus.revision` against the current document `_rev` (e.g. the
     * publish action's scheduled-publish guard) will see a stale revision and may
     * never consider validation "complete" for the current document state.
     *
     * To fix this, we track `documentRevision$` separately from `documentToValidate$`
     * and always override the revision in the emitted validation status.
     */
    const documentRevision$ = document$.pipe(map((document) => document?._rev))

    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    const validated$ = combineLatest([
      validateDocumentWithReferences(ctx, documentToValidate$, scheduling),
      documentToValidate$,
      // keep last: a new document must reach `documentToValidate` before its revision does
      documentRevision$,
    ]).pipe(
      map(([validationStatus, documentToValidate, revision]) => {
        // A run starts a tick after its document and reports the document's revision as it
        // starts; until then the previous result would read as final. A document without a
        // `_type` gets a run that reports no revision, so it's never pending.
        const isPending =
          Boolean(documentToValidate?._type) &&
          validationStatus.revision !== documentToValidate?._rev
        return {
          ...validationStatus,
          isValidating: validationStatus.isValidating || isPending,
          revision,
        }
      }),
    )
    const status$ = merge(loadError$, validated$)
    // shared: the first subscriber switches to `immediate`, the last one to leave switches back
    const holdImmediate$ = new Observable<never>(() => {
      scheduling.next('immediate')
      return () => scheduling.next('idle')
    }).pipe(share())

    return {status$, immediate$: merge(holdImmediate$, status$)}
  },
  (ctx, idPair, typeName, validationTarget, listener) => {
    // Use the actual document ID being validated in the cache key for explicitness
    const documentId = getValidationTargetId(idPair, validationTarget)
    // Include the user id so an in-place user switch gets its own cache entry;
    // the module-level memo cache is never cleared, so without this a new user
    // would replay the previous user's validation result.
    const userId = ctx.currentUser?.id ?? ''
    return `${memoizeKeyGen(ctx.client, idPair, typeName)}-${documentId}-${userId}-${listener}`
  },
)

/**
 * The document's validation status. Every subscriber shares one validation of the document, which
 * runs without waiting for idle time while any subscription made with `immediate` scheduling lasts.
 *
 * @internal
 */
export function validation(
  ctx: Parameters<typeof validationStreams>[0],
  idPair: IdPair,
  typeName: string,
  validationTarget: DocumentVariantType,
  /**
   * @deprecated Ignored. Whether references must be published is decided by the document.
   */
  _validatePublishedReferences?: boolean,
  scheduling?: ValidationScheduling,
  listener: ValidationListener = 'document',
): Observable<ValidationStatus> {
  const {status$, immediate$} = validationStreams(ctx, idPair, typeName, validationTarget, listener)
  return scheduling === 'immediate' ? immediate$ : status$
}
