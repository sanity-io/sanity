import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type Schema} from '@sanity/types'
import {type ValidationScheduling} from '@sanity/validation/_internal'
import omit from 'lodash-es/omit.js'
import {asyncScheduler, BehaviorSubject, combineLatest, type Observable} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, throttleTime} from 'rxjs/operators'

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

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

interface ValidationContext {
  client: SanityClient
  getClient: (options: SourceClientOptions) => SanityClient
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
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

function validationKey(
  ctx: ValidationContext,
  idPair: IdPair,
  typeName: string,
  validationTarget: DocumentVariantType,
  validatePublishedReferences: boolean,
): string {
  // Use the actual document ID being validated in the cache key for explicitness
  const documentId =
    validationTarget === 'draft'
      ? idPair.draftId
      : validationTarget === 'version'
        ? idPair.versionId
        : idPair.publishedId
  // Include the user id so an in-place user switch gets its own cache entry;
  // the module-level memo cache is never cleared, so without this a new user
  // would replay the previous user's validation result.
  const userId = ctx.currentUser?.id ?? ''
  return `${memoizeKeyGen(ctx.client, idPair, typeName)}-${documentId}-${validatePublishedReferences}-${userId}`
}

// One scheduling subject per memoized validation stream, keyed like the stream itself, so the
// scheduling can be changed for a document without holding on to its stream.
const schedulingSubjects = new Map<string, BehaviorSubject<ValidationScheduling>>()

function getSchedulingSubject(key: string): BehaviorSubject<ValidationScheduling> {
  let subject = schedulingSubjects.get(key)
  if (!subject) {
    subject = new BehaviorSubject<ValidationScheduling>('idle')
    schedulingSubjects.set(key, subject)
  }
  return subject
}

/**
 * Changes how the validation runs of a document are paced. `immediate` is for the moment a user
 * is waiting on the result, such as a pending publish: an idle run in flight is dropped and the
 * document is validated right away, blocking the main thread for the duration. Switch back to
 * `idle` once nothing waits on it.
 *
 * @internal
 */
export function setValidationScheduling(
  ctx: ValidationContext,
  idPair: IdPair,
  typeName: string,
  validationTarget: DocumentVariantType,
  validatePublishedReferences: boolean,
  scheduling: ValidationScheduling,
): void {
  getSchedulingSubject(
    validationKey(ctx, idPair, typeName, validationTarget, validatePublishedReferences),
  ).next(scheduling)
}

/** @internal */
export const validation = memoize(
  (
    ctx: ValidationContext,
    {draftId, publishedId, versionId}: IdPair,
    typeName: string,
    validationTarget: DocumentVariantType,
    validatePublishedReferences: boolean,
  ): Observable<ValidationStatus> => {
    const scheduling$ = getSchedulingSubject(
      validationKey(
        ctx,
        {draftId, publishedId, versionId},
        typeName,
        validationTarget,
        validatePublishedReferences,
      ),
    )
    const document$ = editState(ctx, {draftId, publishedId, versionId}, typeName).pipe(
      map((state) => {
        const {version, draft, published} = state

        if (validationTarget === 'draft') return draft
        if (validationTarget === 'version') return version
        return published
      }),
      throttleTime(DOC_UPDATE_DELAY, asyncScheduler, {trailing: true}),
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

    return combineLatest([
      documentRevision$,
      validateDocumentWithReferences(
        ctx,
        documentToValidate$,
        validatePublishedReferences,
        scheduling$,
      ),
    ]).pipe(
      map(([revision, validationStatus]) => {
        return {...validationStatus, revision}
      }),
    )
  },
  validationKey,
)
