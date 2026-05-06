import omit from 'lodash-es/omit.js'
import {combineLatest, distinctUntilChanged, map, type Observable, shareReplay} from 'rxjs'
import shallowEquals from 'shallow-equals'

import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {documentEditState} from './documentEditState'
import {getDocumentMemoizeKey} from './utils'

// Document-scoped validation mirrors pair validation, but validates the single resolved snapshot
// instead of selecting one of draft/published/version from an edit state tuple.
export const documentValidation = memoize(
  (
    documentId: string,
    validatePublishedReferences: boolean,
    ctx: DocumentContext,
  ): Observable<ValidationStatus> => {
    const document$ = documentEditState(documentId, ctx).pipe(map((state) => state.snapshot))

    const documentToValidate$ = document$.pipe(
      distinctUntilChanged((prev, next) => {
        if (prev?._rev === next?._rev) {
          return true
        }
        // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
        // so only pass on documents if _other_ attributes changes
        return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
      }),
      shareReplay({bufferSize: 1, refCount: true}),
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
  (documentId, validatePublishedReferences, ctx) =>
    getDocumentMemoizeKey(ctx.client, documentId, validatePublishedReferences),
)
