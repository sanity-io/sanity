import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type Schema} from '@sanity/types'
import {from, isObservable, map, of, type Observable} from 'rxjs'
import {shareReplay, switchMap} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config'
import {type LocaleSource} from '../../../i18n'
import {type DraftsModelDocumentAvailability, type DocumentPreviewStore} from '../../../preview'
import {type ValidationStatus} from '../../../validation'
import {type HistoryStore} from '../../history'
import {type DocumentVersionEvent} from '../document-pair/checkoutPair'
import {type EditStateFor} from '../document-pair/editState'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {memoize} from '../utils/createMemoizer'
import {documentCheckout, type DocumentCheckout} from './documentCheckout'
import {documentConsistencyStatus} from './documentConsistencyStatus'
import {documentEditOperations} from './documentEditOperations'
import {documentEditState} from './documentEditState'
import {documentEvents} from './documentEvents'
import {
  documentOperationEvents,
  type DocumentOperationError,
  type DocumentOperationSuccess,
} from './documentOperationEvents'
import {documentValidation} from './documentValidation'
import {type DocumentOperationsAPI} from './operations/types'
import {resolveTarget} from './resolveDocumentTarget'
import {type DocumentTarget} from './types'
import {getTargetKey} from './utils'

/** @internal */
export interface DocumentStoreDocument {
  resolveDocumentTarget: (target: DocumentTarget) => Observable<string>
  /**
   * @param documentId - The final id of the document to checkout.
   * The id can be obtained by calling `resolveDocumentTarget` with the target.
   */
  checkoutDocument: (documentId: string) => DocumentCheckout
  consistencyStatus: (target: DocumentTarget) => Observable<boolean>
  documentEvents: (target: DocumentTarget) => Observable<DocumentVersionEvent>
  editOperations: (target: DocumentTarget, typeName: string) => Observable<DocumentOperationsAPI>
  editState: (target: DocumentTarget) => Observable<EditStateFor>
  operationEvents: (
    target: DocumentTarget,
    typeName: string,
  ) => Observable<DocumentOperationSuccess | DocumentOperationError>
  validation: (
    target: DocumentTarget,
    validatePublishedReferences: boolean,
  ) => Observable<ValidationStatus>
}

export interface DocumentContext {
  client: SanityClient
  getClient: (options: SourceClientOptions) => SanityClient
  // TODO: Do we need to refactor this to use the new document ids model?
  observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
  schema: Schema
  i18n: LocaleSource
  extraOptions?: DocumentStoreExtraOptions
  currentUser?: Omit<CurrentUser, 'role'> | null
  documentPreviewStore: DocumentPreviewStore
  historyStore: HistoryStore
}

// Memoized counterpart to `getIdPairFromPublished`: resolves one selected target to the
// concrete document id every document-scoped store method should share.
const resolveDocumentTarget = memoize((target: DocumentTarget): Observable<string> => {
  return from(resolveTarget(target)).pipe(shareReplay({bufferSize: 1, refCount: true}))
}, getTargetKey)

// Keeps document-scoped methods from repeating the same resolve-then-switchMap wrapper.
const withResolvedTarget =
  <Result>(fn: (resolved: string) => Observable<Result> | Result) =>
  (target: DocumentTarget): Observable<Result> =>
    resolveDocumentTarget(target).pipe(
      switchMap((resolved) => {
        const result = fn(resolved)
        return isObservable(result) ? result : of(result)
      }),
    )

/** @internal */
// Single-document facade that mirrors `documentStore.pair`, but starts from an explicit target
// and resolves it to one concrete document before calling the underlying document pipelines.
export function createDocumentStoreDocument(ctx: DocumentContext): DocumentStoreDocument {
  return {
    checkoutDocument(documentId) {
      return documentCheckout(documentId, ctx.client, ctx.extraOptions)
    },
    resolveDocumentTarget(target) {
      return resolveDocumentTarget(target)
    },
    consistencyStatus(target) {
      return withResolvedTarget((resolved) =>
        documentConsistencyStatus(resolved, ctx.client, ctx.extraOptions),
      )(target)
    },
    documentEvents(target) {
      return withResolvedTarget((resolved) =>
        documentEvents(resolved, ctx.client, ctx.extraOptions),
      )(target)
    },
    editOperations(target, typeName) {
      return withResolvedTarget((resolved) =>
        documentEditOperations(resolved, ctx, target, typeName),
      )(target)
    },
    editState(target) {
      return withResolvedTarget((resolved) => documentEditState(resolved, ctx))(target)
    },
    operationEvents(target, typeName) {
      return withResolvedTarget((resolved) =>
        documentOperationEvents(ctx, resolved, target, typeName),
      )(target).pipe(
        // No need to filter here because the documentOperationEvents applies only to the resolved documentId
        // filter((result) => result.args.documentId === resolved),
        map((result): DocumentOperationSuccess | DocumentOperationError => {
          const {operationName} = result.args

          return result.type === 'success'
            ? {
                type: 'success',
                op: operationName,
                id: result.args.documentId,
              }
            : {
                type: 'error',
                op: operationName,
                id: result.args.documentId,
                error: result.error,
              }
        }),
      )
    },
    validation(target, validatePublishedReferences) {
      return withResolvedTarget((resolved) =>
        documentValidation(resolved, validatePublishedReferences, ctx),
      )(target)
    },
  }
}
