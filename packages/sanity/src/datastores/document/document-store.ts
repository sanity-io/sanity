import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {Observable} from 'rxjs'
import {getDraftId, isDraftId} from '../../util'
import {HistoryStore} from '../history'
import {DocumentPreviewStore} from '../../preview'
import {Template} from '../../templates'
import {checkoutPair, DocumentVersionEvent, Pair} from './document-pair/checkoutPair'
import {consistencyStatus} from './document-pair/consistencyStatus'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, EditStateFor} from './document-pair/editState'
import {getOperationEvents, OperationError, OperationSuccess} from './document-pair/operationEvents'
import {OperationsAPI} from './document-pair/operations'
import {validation, ValidationStatus} from './document-pair/validation'
import {listenQuery, ListenQueryOptions} from './listenQuery'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {IdPair} from './types'
import {getInitialValueStream, InitialValueMsg, InitialValueOptions} from './initialValue'

export type QueryParams = Record<string, string | number | boolean | string[]>

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}

export interface DocumentStore {
  checkoutPair: (idPair: IdPair) => Pair
  initialValue: (opts: InitialValueOptions) => Observable<InitialValueMsg>
  listenQuery: (
    query: string | {fetch: string; listen: string},
    params: QueryParams,
    options: ListenQueryOptions
  ) => Observable<any>
  resolveTypeForDocument: (id: string, specifiedType?: string) => Observable<string>

  pair: {
    consistencyStatus: (publishedId: string, type: string) => Observable<boolean>
    documentEvents: (publishedId: string, type: string) => Observable<DocumentVersionEvent>
    editOperations: (publishedId: string, type: string) => Observable<OperationsAPI>
    editState: (publishedId: string, type: string) => Observable<EditStateFor>
    operationEvents: (
      publishedId: string,
      type: string
    ) => Observable<OperationSuccess | OperationError>
    validation: (publishedId: string, type: string) => Observable<ValidationStatus>
  }
}

export interface DocumentStoreOptions {
  client: SanityClient
  documentPreviewStore: DocumentPreviewStore
  historyStore: HistoryStore
  schema: Schema
  initialValueTemplates: Template[]
}

export function createDocumentStore({
  client,
  documentPreviewStore,
  historyStore,
  initialValueTemplates,
  schema,
}: DocumentStoreOptions): DocumentStore {
  const versionedClient = client.withConfig({
    apiVersion: '2021-12-01',
  })

  const ctx = {client, documentPreviewStore, historyStore, schema}

  const caches = {
    pair: {
      editOperations: new Map(),
    },
  }

  const operationEvents = getOperationEvents(ctx)

  return {
    // Public API
    checkoutPair(idPair) {
      return checkoutPair(versionedClient, idPair)
    },
    initialValue(opts) {
      return getInitialValueStream(schema, initialValueTemplates, documentPreviewStore, opts)
    },
    listenQuery(query, params, options) {
      return listenQuery(versionedClient, query, params, options)
    },
    resolveTypeForDocument(id, specifiedType) {
      return resolveTypeForDocument(versionedClient, id, specifiedType)
    },
    pair: {
      consistencyStatus(publishedId, type) {
        return consistencyStatus(ctx.client, getIdPairFromPublished(publishedId), type)
      },
      documentEvents(publishedId, type) {
        return documentEvents(ctx.client, getIdPairFromPublished(publishedId), type)
      },
      editOperations(publishedId, type) {
        const cache = caches.pair.editOperations
        const key = `${publishedId}:${type}`

        if (!cache.has(key)) {
          cache.set(key, editOperations(ctx, getIdPairFromPublished(publishedId), type))
        }

        return cache.get(key)
      },
      editState(publishedId, type) {
        return editState(ctx, getIdPairFromPublished(publishedId), type)
      },
      operationEvents(publishedId, type) {
        return operationEvents(getIdPairFromPublished(publishedId), type)
      },
      validation(publishedId, type) {
        return validation(ctx, getIdPairFromPublished(publishedId), type)
      },
    },
  }
}
