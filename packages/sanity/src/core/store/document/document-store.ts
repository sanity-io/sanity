import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type InitialValueResolverContext, type Schema} from '@sanity/types'
import {of, type Observable} from 'rxjs'
import {filter, map, shareReplay, startWith, switchMap} from 'rxjs/operators'

import {type SourceClientOptions} from '../../config'
import {type LocaleSource} from '../../i18n'
import {type DocumentPreviewStore} from '../../preview'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {type Template} from '../../templates'
import {
  getDocumentVariantType,
  getIdPair,
  getPublishedId,
  getVersionFromId,
  isDraftId,
  isVersionId,
} from '../../util'
import {type ValidationStatus} from '../../validation'
import {type HistoryStore} from '../history'
import {checkoutPair, type DocumentVersionEvent, type Pair} from './document-pair/checkoutPair'
import {consistencyStatus} from './document-pair/consistencyStatus'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, type EditStateFor, getInitialEditState} from './document-pair/editState'
import {
  type OperationError,
  operationEvents,
  type OperationSuccess,
} from './document-pair/operationEvents'
import {type OperationsAPI} from './document-pair/operations'
import {GUARDED} from './document-pair/operations/helpers'
import {INITIAL_VALIDATION_STATUS, validation} from './document-pair/validation'
import {type DocumentStoreExtraOptions} from './getPairListener'
import {getInitialValueStream, type InitialValueMsg, type InitialValueOptions} from './initialValue'
import {listenQuery, type ListenQueryOptions} from './listenQuery'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {type IdPair} from './types'
import {memoize} from './utils/createMemoizer'

/**
 * @hidden
 * @beta */
export type QueryParams = Record<string, string | number | boolean | string[]>

function getIdPairFromPublished(publishedId: string, version?: string): IdPair {
  if (version === 'published' || version === 'drafts') {
    throw new Error('Version Id cannot be "published" or "drafts"')
  }
  if (isVersionId(publishedId)) {
    throw new Error('editOpsOf does not expect a version id.')
  }
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return getIdPair(publishedId, {version})
}

/**
 * This is currently prepared as an observable to support resolving
 * the id pair asynchronously which will be necessary once we support variants.
 */
const resolveIdPair = memoize(
  (_client: SanityClient, publishedId: string, version?: string): Observable<IdPair> => {
    return of(getIdPairFromPublished(publishedId, version)).pipe(
      shareReplay({refCount: true, bufferSize: 1}),
    )
  },
  (client: SanityClient, publishedId: string, version?: string) => {
    const config = client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${publishedId}-${version ?? ''}`
  },
)

/**
 * @hidden
 * @beta */
export interface DocumentStore {
  /**
   * Checks out a document (with its published and draft version) for real-time editing.
   * Note that every call to this function will open a new listener to the server.
   * It's recommended to use the helper functions on `pair` below which will re-use a single connection.
   *
   * @internal
   **/
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
    consistencyStatus: (publishedId: string, type: string, version?: string) => Observable<boolean>
    /** @internal */
    documentEvents: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<DocumentVersionEvent>
    /** @internal */
    editOperations: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<OperationsAPI>
    editState: (publishedId: string, type: string, version?: string) => Observable<EditStateFor>
    operationEvents: (
      publishedId: string,
      type: string,
    ) => Observable<OperationSuccess | OperationError>
    validation: (
      validationTargetId: string,
      type: string,
      // Whether to require referenced documents to be published
      // if `true`, any reference to a document that's not published will yield a validation error
      // if `false`, any reference to a non-published document is ok as long as it's in the same bundle
      // as the document we're validating
      validatePublishedReferences: boolean,
    ) => Observable<ValidationStatus>
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
  /**
   * @deprecated Does nothing. Preserved to avoid breaking changes.
   * Will be removed in the next major version.
   */
  serverActionsEnabled?: Observable<boolean>
  extraOptions?: DocumentStoreExtraOptions
  currentUser?: Omit<CurrentUser, 'role'> | null
}

/** @internal */
export function createDocumentStore({
  getClient,
  documentPreviewStore,
  historyStore,
  initialValueTemplates,
  schema,
  i18n,
  extraOptions = {},
  currentUser,
}: DocumentStoreOptions): DocumentStore {
  const observeDocumentPairAvailability =
    documentPreviewStore.unstable_observeDocumentPairAvailability

  // Note that we're both passing a shared `client` here which is used by the
  // internal operations, and a `getClient` method that we expose to user-land
  // for things like validations
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {
    onSyncErrorRecovery,
    onReportLatency,
    onSlowCommit,
    onReportMutationPerformance,
    onDocumentRebase,
  } = extraOptions
  const ctx = {
    client,
    getClient,
    observeDocumentPairAvailability,
    historyStore,
    schema,
    i18n,
    extraOptions,
    currentUser,
  }

  function withResolvedIdPair<T>(
    publishedId: string,
    version: string | undefined,
    initialValue: T | undefined,
    project: (idPair: IdPair) => Observable<T>,
  ): Observable<T> {
    const resolved$ = resolveIdPair(client, publishedId, version).pipe(switchMap(project))

    return typeof initialValue === 'undefined' ? resolved$ : resolved$.pipe(startWith(initialValue))
  }

  return {
    // Public API
    checkoutPair(idPair) {
      return checkoutPair(client, idPair, undefined, {
        onSyncErrorRecovery,
        onReportLatency,
        onSlowCommit,
        onReportMutationPerformance,
        onDocumentRebase,
      })
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
      consistencyStatus(publishedId, type, version) {
        return withResolvedIdPair(publishedId, version, true, (idPair) =>
          consistencyStatus(ctx.client, idPair, type, extraOptions),
        )
      },
      documentEvents(publishedId, type, version) {
        return withResolvedIdPair(publishedId, version, undefined, (idPair) =>
          documentEvents(ctx.client, idPair, type, extraOptions),
        )
      },
      editOperations(publishedId, type, version) {
        return withResolvedIdPair(publishedId, version, GUARDED, (idPair) =>
          editOperations(ctx, idPair, type),
        )
      },
      editState(publishedId, type, version) {
        return withResolvedIdPair(
          publishedId,
          version,
          getInitialEditState({
            schema,
            publishedId,
            typeName: type,
            version,
          }),
          (idPair) => editState(ctx, idPair, type),
        )
      },
      operationEvents(publishedId, type) {
        return withResolvedIdPair(publishedId, undefined, undefined, (resolvedPair) =>
          operationEvents({
            client,
            historyStore,
            schema,
            extraOptions,
          }).pipe(
            filter(
              (result) =>
                result.args.idPair.publishedId === resolvedPair.publishedId &&
                result.args.typeName === type,
            ),
            map((result): OperationSuccess | OperationError => {
              const {operationName, idPair} = result.args
              return result.type === 'success'
                ? {
                    type: 'success',
                    op: operationName,
                    id: idPair.publishedId,
                    idPair,
                  }
                : {
                    type: 'error',
                    op: operationName,
                    id: idPair.publishedId,
                    error: result.error,
                    idPair,
                  }
            }),
          ),
        )
      },
      validation(validationTargetId, type, requirePublishedReferences) {
        const publishedId = getPublishedId(validationTargetId)
        const validationTarget = getDocumentVariantType(validationTargetId)
        const version = getVersionFromId(validationTargetId)

        return withResolvedIdPair(publishedId, version, INITIAL_VALIDATION_STATUS, (idPair) =>
          validation(ctx, idPair, type, validationTarget, requirePublishedReferences),
        )
      },
    },
  }
}
