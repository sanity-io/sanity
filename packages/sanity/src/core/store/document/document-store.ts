import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type InitialValueResolverContext, type Schema} from '@sanity/types'
import {type Observable, of} from 'rxjs'
import {filter, map} from 'rxjs/operators'

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
import {
  checkoutPair,
  type CommitError,
  type DocumentVersionEvent,
  type Pair,
} from './document-pair/checkoutPair'
import {commitErrorStatus} from './document-pair/commitErrorStatus'
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
import {GUARDED, TARGET_NOT_FOUND_OPERATIONS} from './document-pair/operations/helpers'
import {validation} from './document-pair/validation'
import {type DocumentStoreExtraOptions} from './getPairListener'
import {getInitialValueStream, type InitialValueMsg, type InitialValueOptions} from './initialValue'
import {listenQuery, type ListenQueryOptions} from './listenQuery'
import {getPairTargetScopeId, normalizeDocumentPairTarget} from './normalizeDocumentPairTarget'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {type DocumentPairTarget, type IdPair} from './types'

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
    /** @internal */
    commitErrorStatus: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<CommitError | undefined>
    consistencyStatus: (publishedId: string, type: string, version?: string) => Observable<boolean>
    /** @internal */
    documentEvents: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<DocumentVersionEvent>
    /**
     * @internal
     * `version` accepts either a plain version name (release/bundle) or a
     * {@link DocumentPairTarget}. The guarded target kinds (`unresolved`, `target-missing`) emit
     * a disabled operations API without checking out a pair, so operations can never reach the
     * base draft/published pair while a selected target is unresolved or has no document.
     */
    editOperations: (
      publishedId: string,
      type: string,
      version?: string | DocumentPairTarget,
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
      commitErrorStatus(publishedId, type, version) {
        return commitErrorStatus(
          ctx.client,
          getIdPairFromPublished(publishedId, version),
          type,
          extraOptions,
        )
      },
      consistencyStatus(publishedId, type, version) {
        return consistencyStatus(
          ctx.client,
          getIdPairFromPublished(publishedId, version),
          type,
          extraOptions,
        )
      },
      documentEvents(publishedId, type, version) {
        return documentEvents(
          ctx.client,
          getIdPairFromPublished(publishedId, version),
          type,
          extraOptions,
        )
      },
      editOperations(publishedId, type, version) {
        const target = normalizeDocumentPairTarget(version)

        // Guarded targets never check out a pair. Branching here (before the memoized
        // `editOperations`) also keeps them out of `memoizeKeyGen`, which only keys on
        // `publishedId + versionId` and would collide these with the base pair.
        if (target?.kind === 'unresolved') {
          return of(GUARDED)
        }
        if (target?.kind === 'target-missing') {
          return of(TARGET_NOT_FOUND_OPERATIONS)
        }

        return editOperations(
          ctx,
          getIdPairFromPublished(publishedId, getPairTargetScopeId(target)),
          type,
        )
      },
      editState(publishedId, type, version) {
        const idPair = getIdPairFromPublished(publishedId, version)

        const edit = editState(ctx, idPair, type)
        return edit
      },
      operationEvents(publishedId, type) {
        return operationEvents({
          client,
          historyStore,
          schema,
          extraOptions,
        }).pipe(
          filter(
            (result) =>
              result.args.idPair.publishedId === publishedId && result.args.typeName === type,
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
        )
      },
      validation(validationTargetId, type, requirePublishedReferences) {
        const publishedId = getPublishedId(validationTargetId)
        const idPair = getIdPair(publishedId, {version: getVersionFromId(validationTargetId)})
        const validationTarget = getDocumentVariantType(validationTargetId)
        return validation(ctx, idPair, type, validationTarget, requirePublishedReferences)
      },
    },
  }
}
