import {type SanityClient} from '@sanity/client'
import {isObservable, map, of, type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../../preview'
import {type ValidationStatus} from '../../../validation'
import {type HistoryStore} from '../../history'
import {type DocumentVersionEvent} from '../document-pair/checkoutPair'
import {type EditStateFor} from '../document-pair/editState'
import {type DocumentStoreExtraOptions} from '../getPairListener'
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
import {type DocumentOperationsAPI} from './operations/types'
import {resolveDocumentTarget} from './resolveDocumentTarget'
import {type DocumentTarget} from './types'

/** @internal */
export interface DocumentStoreDocumentCore {
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
}

/** @internal */
export interface DocumentStoreDocument extends DocumentStoreDocumentCore {
  validation: (
    target: DocumentTarget,
    validatePublishedReferences: boolean,
  ) => Observable<ValidationStatus>
}

export interface DocumentContext {
  client: SanityClient
  extraOptions?: DocumentStoreExtraOptions
  documentPreviewStore: DocumentPreviewStore
  historyStore: HistoryStore
}

// Wraps a function that takes a resolved document id and returns the result to the observable.
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
export function createDocumentStoreDocument(ctx: DocumentContext): DocumentStoreDocumentCore {
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
  }
}
