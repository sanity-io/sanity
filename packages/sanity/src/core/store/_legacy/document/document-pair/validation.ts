import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {omit} from 'lodash-es'
import {asyncScheduler, combineLatest, type Observable} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, throttleTime} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

import {type SourceClientOptions} from '../../../../config'
import {type LocaleSource} from '../../../../i18n'
import {type DraftsModelDocumentAvailability} from '../../../../preview'
import {type DocumentVariantType} from '../../../../util/getDocumentVariantType'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../../validation'
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

/** @internal */
export const validation = memoize(
  (
    ctx: {
      client: SanityClient
      getClient: (options: SourceClientOptions) => SanityClient
      observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
      schema: Schema
      i18n: LocaleSource
      serverActionsEnabled: Observable<boolean>
      pairListenerOptions?: DocumentStoreExtraOptions
    },
    {draftId, publishedId, versionId}: IdPair,
    typeName: string,
    validationTarget: DocumentVariantType,
    validatePublishedReferences: boolean,
  ): Observable<ValidationStatus> => {
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
      validateDocumentWithReferences(ctx, documentToValidate$, validatePublishedReferences),
    ]).pipe(
      map(([revision, validationStatus]) => {
        return {...validationStatus, revision}
      }),
    )
  },
  (ctx, idPair, typeName, validationTarget, validatePublishedReferences) => {
    // Use the actual document ID being validated in the cache key for explicitness
    const documentId =
      validationTarget === 'draft'
        ? idPair.draftId
        : validationTarget === 'version'
          ? idPair.versionId
          : idPair.publishedId
    return `${memoizeKeyGen(ctx.client, idPair, typeName)}-${documentId}-${validatePublishedReferences}`
  },
)
