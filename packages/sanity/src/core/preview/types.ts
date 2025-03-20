import {type StackablePerspective} from '@sanity/client'
import {
  type CrossDatasetType,
  type GlobalDocumentReferenceType,
  type PreviewValue,
  type Reference,
  type SanityDocumentLike,
  type SchemaType,
} from '@sanity/types'
import {type Observable} from 'rxjs'

/** @internal */
export type Id = string

/**
 * @hidden
 * @beta */
export type Previewable = (
  | {_id: string}
  | {_type: string}
  | {_ref: string; _dataset?: string; _projectId?: string}
) & {
  /**
   * optional object used to attach meta data to the prepared result.
   * currently used to add a flag for the invalid preview error fallback and
   * insufficient permissions fallback
   * @internal
   */
  _internalMeta?: {type?: string}
}

/**
 * TODO: unify with content path from `@sanity/types`
 *
 *
 * @hidden
 * @beta
 */
export type PreviewPath = FieldName[]

/** @internal */
export type Selection = [id: Id, fields: FieldName[]]

/**
 * @hidden
 * @beta */
export type FieldName = string

/** @internal */
export interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

/** @internal */
export type AvailabilityReason = 'READABLE' | 'PERMISSION_DENIED' | 'NOT_FOUND'

/**
 * @hidden
 * @beta */
export type PreviewableType = SchemaType | CrossDatasetType | GlobalDocumentReferenceType

/**
 * @hidden
 * @beta */
export interface ApiConfig {
  projectId: string
  dataset: string
}

/**
 * @hidden
 * @beta */
export type DocumentAvailability =
  | {
      available: true
      reason: 'READABLE'
    }
  | {
      available: false
      reason: 'PERMISSION_DENIED' | 'NOT_FOUND'
    }

/**
 * @hidden
 * @beta */
export interface DraftsModelDocumentAvailability {
  /**
   * document readability for the published document
   */
  published: DocumentAvailability

  /**
   * document readability for the draft document
   */
  draft: DocumentAvailability

  /**
   * document readability for the version document
   */
  version?: DocumentAvailability
}

/**
 * @hidden
 * @beta */
export interface DraftsModelDocument<T extends SanityDocumentLike = SanityDocumentLike> {
  id: string
  type: string | null
  draft: {
    availability: DocumentAvailability
    snapshot: T | undefined
  }
  published: {
    availability: DocumentAvailability
    snapshot: T | undefined
  }
  version?: {
    availability: DocumentAvailability
    snapshot: T | undefined
  }
}

/**
 * Event emitted to notify preview subscribers when they need to refetch a document being previewed
 * - 'connected' will happen when the store is connected to the invalidation channel, both initially and after a reconnect after a connection loss
 * - 'mutation' will happen when a document has been mutated and the store needs to refetch a document
 * @hidden
 * @beta
 */
export type InvalidationChannelEvent =
  | {type: 'connected'}
  | {type: 'mutation'; documentId: string; visibility: string}

/**
 * @hidden
 * @beta */
export interface PreparedSnapshot {
  type?: PreviewableType
  snapshot: PreviewValue | null | undefined
}

/** @internal */
export type ObserveDocumentTypeFromIdFn = (
  id: string,
  apiConfig?: ApiConfig,
  perspective?: StackablePerspective[],
) => Observable<string | undefined>

/**
 * @hidden
 * @beta */
export interface ObservePathsFn {
  (
    value: Previewable,
    paths: (string | PreviewPath)[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ): Observable<PreviewValue | SanityDocumentLike | Reference | string | null>
}

/**
 * @hidden
 * @beta */
export interface ObserveDocumentAvailabilityFn {
  (
    id: string,
    options?: {version?: string},
  ): Observable<{
    draft: DocumentAvailability
    published: DocumentAvailability
    version?: DocumentAvailability
  }>
}
