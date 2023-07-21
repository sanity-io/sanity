import {SanityClient} from '@sanity/client'
import {InitialValueResolverContext, Schema} from '@sanity/types'
import {Observable} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {HistoryStore} from '../history'
import {DocumentPreviewStore} from '../../../preview'
import {getDraftId, isDraftId} from '../../../util'
import {Template} from '../../../templates'
import {SourceClientOptions} from '../../../config'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {checkoutPair, DocumentVersionEvent, Pair} from './document-pair/checkoutPair'
import {consistencyStatus} from './document-pair/consistencyStatus'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, EditStateFor} from './document-pair/editState'
import {operationEvents, OperationError, OperationSuccess} from './document-pair/operationEvents'
import {OperationsAPI} from './document-pair/operations'
import {validation, ValidationStatus} from './document-pair/validation'
import {listenQuery, ListenQueryOptions} from './listenQuery'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import type {IdPair} from './types'
import {getInitialValueStream, InitialValueMsg, InitialValueOptions} from './initialValue'
import {LocaleSource} from '../../../i18n'

/**
 * @hidden
 * @beta */
export type QueryParams = Record<string, string | number | boolean | string[]>

function getIdPairFromPublished(publishedId: string): IdPair {
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
}

/** @internal */
export function createDocumentStore({
  getClient,
  documentPreviewStore,
  historyStore,
  initialValueTemplates,
  schema,
  i18n,
}: DocumentStoreOptions): DocumentStore {
  const observeDocumentPairAvailability =
    documentPreviewStore.unstable_observeDocumentPairAvailability

  // Note that we're both passing a shared `client` here which is used by the
  // internal operations, and a `getClient` method that we expose to user-land
  // for things like validations
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const ctx = {client, getClient, observeDocumentPairAvailability, historyStore, schema, i18n}

  return {
    // Public API
    checkoutPair(idPair) {
      return checkoutPair(client, idPair)
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
    listenQuery(query, params, options) {
      return listenQuery(client, query, params, options)
    },
    resolveTypeForDocument(id, specifiedType) {
      return resolveTypeForDocument(client, id, specifiedType)
    },
    pair: {
      consistencyStatus(publishedId, type) {
        return consistencyStatus(ctx.client, getIdPairFromPublished(publishedId), type)
      },
      documentEvents(publishedId, type) {
        return documentEvents(ctx.client, getIdPairFromPublished(publishedId), type)
      },
      editOperations(publishedId, type) {
        return editOperations(ctx, getIdPairFromPublished(publishedId), type)
      },
      editState(publishedId, type) {
        return editState(ctx, getIdPairFromPublished(publishedId), type)
      },
      operationEvents(publishedId, type) {
        return operationEvents({client, historyStore, schema}).pipe(
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
        return validation(ctx, getIdPairFromPublished(publishedId), type)
      },
    },
  }
}
