import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type SanityDocument, type Schema} from '@sanity/types'
import {type ValidationScheduling} from '@sanity/validation/_internal'
import omit from 'lodash-es/omit.js'
import {asyncScheduler, BehaviorSubject, combineLatest, merge, Observable, of, timer} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  retry,
  share,
  shareReplay,
  switchMap,
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
import {checkedOutEditState, editState, type EditStateFor} from './editState'
import {memoizeKeyGen} from './memoizeKeyGen'

// throttle delay for document updates (i.e. time between responding to changes in the current document)
const DOC_UPDATE_DELAY = 200

// Same limit as the preview store's document-count fetch. An unbounded retry would never surface
// the failure.
const MAX_GLOBAL_DOCUMENT_LOAD_RETRIES = 3

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

/**
 * Where the validated document comes from:
 *
 * - `auto` validates from the document pair while another subscriber has it checked out, like a
 *   document pane, and follows the document through the document preview store's shared global
 *   listener otherwise. It never checks out the pair itself.
 * - `document` checks out the document pair, which opens a listener for it.
 * - `global` always follows the document through the shared global listener.
 */
export type ValidationListener = 'auto' | 'document' | 'global'

/**
 * The document a validation run reads: the checked out pair's, or the global listener's. Every
 * listener that resolves to the same source shares its run.
 */
type ValidationSource = 'pair' | 'global'

type ValidationContext = {
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
}

type ValidationStreams = {
  status$: Observable<ValidationStatus>
  immediate$: Observable<ValidationStatus>
}

function getValidationTargetId(idPair: IdPair, validationTarget: DocumentVariantType) {
  if (validationTarget === 'draft') return idPair.draftId
  if (validationTarget === 'version') return idPair.versionId
  return idPair.publishedId
}

function getValidationTarget(state: EditStateFor, validationTarget: DocumentVariantType) {
  if (validationTarget === 'draft') return state.draft
  if (validationTarget === 'version') return state.version
  return state.published
}

function getValidationKey(
  ctx: ValidationContext,
  idPair: IdPair,
  typeName: string,
  validationTarget: DocumentVariantType,
) {
  // Use the actual document ID being validated in the cache key for explicitness
  const documentId = getValidationTargetId(idPair, validationTarget)
  // Include the user id so an in-place user switch gets its own cache entry;
  // the module-level memo cache is never cleared, so without this a new user
  // would replay the previous user's validation result.
  const userId = ctx.currentUser?.id ?? ''
  return `${memoizeKeyGen(ctx.client, idPair, typeName)}-${documentId}-${userId}`
}

const validationRuns = memoize(
  (
    ctx: ValidationContext,
    idPair: IdPair,
    typeName: string,
    validationTarget: DocumentVariantType,
    source: ValidationSource,
  ): ValidationStreams => {
    const documentId = getValidationTargetId(idPair, validationTarget)
    const target$: Observable<SanityDocument | null | undefined> =
      source === 'global'
        ? documentId
          ? ctx.observeDocument(documentId).pipe(
              // A failed fetch or a dropped global listener would error the validation, which
              // `useValidationStatus` rethrows during render. Retry three times, the same limit as
              // the preview store's document-count fetch, then let that error through.
              retry({
                count: MAX_GLOBAL_DOCUMENT_LOAD_RETRIES,
                delay: (_error: unknown, attempt) => timer(Math.min(30_000, attempt * 1000)),
              }),
            )
          : of(undefined)
        : // Never checks out the pair: `document` holds it, and `auto` reads this run only while
          // something else does. Its placeholder and cached states aren't the document yet.
          checkedOutEditState(ctx.client, idPair, typeName).pipe(
            filter((state): state is EditStateFor => Boolean(state?.ready)),
            map((state) => getValidationTarget(state, validationTarget)),
          )
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
    const status$ = combineLatest([
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
    // shared: the first subscriber switches to `immediate`, the last one to leave switches back
    const holdImmediate$ = new Observable<never>(() => {
      scheduling.next('immediate')
      return () => scheduling.next('idle')
    }).pipe(share())

    return {status$, immediate$: merge(holdImmediate$, status$)}
  },
  (ctx, idPair, typeName, validationTarget, source) =>
    `${getValidationKey(ctx, idPair, typeName, validationTarget)}-${source}`,
)

const validationStreams = memoize(
  (
    ctx: ValidationContext,
    idPair: IdPair,
    typeName: string,
    validationTarget: DocumentVariantType,
    listener: ValidationListener,
  ): ValidationStreams => {
    const run = (source: ValidationSource) =>
      validationRuns(ctx, idPair, typeName, validationTarget, source)

    switch (listener) {
      case 'global':
        return run('global')
      case 'document': {
        // subscribed first, so the pair run finds the pair checked out
        const checkOut$ = editState(ctx, idPair, typeName).pipe(ignoreElements())
        const pairRun = run('pair')
        return {
          status$: merge(checkOut$, pairRun.status$),
          immediate$: merge(checkOut$, pairRun.immediate$),
        }
      }
      case 'auto': {
        const source$ = checkedOutEditState(ctx.client, idPair, typeName).pipe(
          map((state) => state !== null),
          distinctUntilChanged(),
          // Passive effects run child first, so a document action can subscribe a moment before
          // its pane checks the pair out. Use the pair at once, but give it a tick before
          // falling back to the global listener.
          switchMap((checkedOut) => (checkedOut ? of(true) : timer(0).pipe(map(() => false)))),
          distinctUntilChanged(),
          map((checkedOut): ValidationSource => (checkedOut ? 'pair' : 'global')),
        )
        // The previous run's status stays until the next run emits, so a switch never reads as
        // an empty result.
        return {
          status$: source$.pipe(switchMap((source) => run(source).status$)),
          immediate$: source$.pipe(switchMap((source) => run(source).immediate$)),
        }
      }
      default: {
        const unknownListener: never = listener
        throw new Error(`Unknown validation listener: ${String(unknownListener)}`)
      }
    }
  },
  (ctx, idPair, typeName, validationTarget, listener) =>
    `${getValidationKey(ctx, idPair, typeName, validationTarget)}-${listener}`,
)

/**
 * The document's validation status. Every subscriber whose `listener` reads the same source shares
 * one validation of the document, which runs without waiting for idle time while any subscription
 * made with `immediate` scheduling lasts.
 *
 * @internal
 */
export function validation(
  ctx: ValidationContext,
  idPair: IdPair,
  typeName: string,
  validationTarget: DocumentVariantType,
  /**
   * @deprecated Ignored. Whether references must be published is decided by the document.
   */
  _validatePublishedReferences?: boolean,
  scheduling?: ValidationScheduling,
  listener: ValidationListener = 'auto',
): Observable<ValidationStatus> {
  const {status$, immediate$} = validationStreams(ctx, idPair, typeName, validationTarget, listener)
  return scheduling === 'immediate' ? immediate$ : status$
}
