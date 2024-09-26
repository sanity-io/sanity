import {type SanityClient} from '@sanity/client'
import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {type Observable} from 'rxjs'
import {filter, map} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config'
import {type LocaleSource} from '../../../i18n'
import {type DocumentPreviewStore} from '../../../preview'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type Template} from '../../../templates'
import {getDraftId, isDraftId, isVersionId} from '../../../util'
import {type ValidationStatus} from '../../../validation'
import {type HistoryStore} from '../history'
import {checkoutPair, type DocumentVersionEvent, type Pair} from './document-pair/checkoutPair'
import {consistencyStatus} from './document-pair/consistencyStatus'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, type EditStateFor} from './document-pair/editState'
import {
  type OperationError,
  operationEvents,
  type OperationSuccess,
} from './document-pair/operationEvents'
import {type OperationsAPI} from './document-pair/operations'
import {getPairFromLocalStorage} from './document-pair/utils/localStoragePOC'
import {validation} from './document-pair/validation'
import {getVisitedDocuments} from './getVisitedDocuments'
import {type PairListenerOptions} from './getPairListener'
import {getInitialValueStream, type InitialValueMsg, type InitialValueOptions} from './initialValue'
import {listenQuery, type ListenQueryOptions} from './listenQuery'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {type IdPair} from './types'

/**
 * @hidden
 * @beta */
export type QueryParams = Record<string, string | number | boolean | string[]>

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isVersionId(publishedId)) {
    throw new Error('editOpsOf does not expect a version id.')
  }
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}

/**
 * @hidden
 * @beta */
export interface DocumentStore {
  /** @internal */
  checkoutPair: (idPair: IdPair) => Pair
  initialValue: (
    opts: InitialValueOptions,
    context: InitialValueResolverContext,
  ) => Observable<InitialValueMsg>
  listenQuery: (
    query: string | {fetch: string; listen: string},
    params: QueryParams,
    options: ListenQueryOptions,
  ) => Observable<any>
  resolveTypeForDocument: (id: string, specifiedType?: string) => Observable<string>

  pair: {
    consistencyStatus: (publishedId: string, type: string) => Observable<boolean>
    /** @internal */
    documentEvents: (publishedId: string, type: string) => Observable<DocumentVersionEvent>
    /** @internal */
    editOperations: (publishedId: string, type: string) => Observable<OperationsAPI>
    editState: (publishedId: string, type: string) => Observable<EditStateFor>
    operationEvents: (
      publishedId: string,
      type: string,
    ) => Observable<OperationSuccess | OperationError>
    validation: (publishedId: string, type: string) => Observable<ValidationStatus>
  }
}

/** @internal */
export interface DocumentStoreOptions {
  getClient: (options: SourceClientOptions) => SanityClient
  documentPreviewStore: DocumentPreviewStore
  historyStore: HistoryStore
  schema: Schema
  initialValueTemplates: Template[]
  i18n: LocaleSource
  serverActionsEnabled: Observable<boolean>
  pairListenerOptions?: PairListenerOptions
}

/** @internal */
export function createDocumentStore({
  getClient,
  documentPreviewStore,
  historyStore,
  initialValueTemplates,
  schema,
  i18n,
  serverActionsEnabled,
  pairListenerOptions,
}: DocumentStoreOptions): DocumentStore {
  const observeDocumentPairAvailability =
    documentPreviewStore.unstable_observeDocumentPairAvailability

  // Note that we're both passing a shared `client` here which is used by the
  // internal operations, and a `getClient` method that we expose to user-land
  // for things like validations
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const ctx = {
    client,
    getClient,
    observeDocumentPairAvailability,
    historyStore,
    schema,
    i18n,
    serverActionsEnabled,
    pairListenerOptions,
  }

  return {
    // Public API
    checkoutPair(idPair) {
      return checkoutPair(client, idPair, serverActionsEnabled, pairListenerOptions)
    },
    initialValue(opts, context) {
      return getInitialValueStream(
        schema,
        initialValueTemplates,
        documentPreviewStore,
        opts,
        context,
      )
    },
    listenQuery(query, params, listenQueryOptions) {
      return listenQuery(client, query, params, listenQueryOptions)
    },
    resolveTypeForDocument(id, specifiedType) {
      return resolveTypeForDocument(client, id, specifiedType)
    },
    pair: {
      consistencyStatus(publishedId, type) {
        return consistencyStatus(
          ctx.client,
          getIdPairFromPublished(publishedId),
          type,
          serverActionsEnabled,
          pairListenerOptions,
        )
      },
      documentEvents(publishedId, type) {
        return documentEvents(
          ctx.client,
          getIdPairFromPublished(publishedId),
          type,
          serverActionsEnabled,
          pairListenerOptions,
        )
      },
      editOperations(publishedId, type) {
        return editOperations(ctx, getIdPairFromPublished(publishedId), type)
      },
      editState(publishedId, type) {
        const idPair = getIdPairFromPublished(publishedId)

        const edit = editState(ctx, idPair, type, getPairFromLocalStorage(idPair))
        return edit
      },
      operationEvents(publishedId, type) {
        return operationEvents({
          client,
          historyStore,
          schema,
          serverActionsEnabled,
          pairListenerOptions,
        }).pipe(
          filter(
            (result) =>
              result.args.idPair.publishedId === publishedId && result.args.typeName === type,
          ),
          map((result): OperationSuccess | OperationError => {
            const {operationName, idPair: documentIds} = result.args
            return result.type === 'success'
              ? {type: 'success', op: operationName, id: documentIds.publishedId}
              : {type: 'error', op: operationName, id: documentIds.publishedId, error: result.error}
          }),
        )
      },
      validation(publishedId, type) {
        const idPair = getIdPairFromPublished(publishedId)
        return validation(ctx, idPair, type, getPairFromLocalStorage(idPair))
      },
    },
  }
}
