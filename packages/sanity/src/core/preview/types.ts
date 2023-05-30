import {PreviewConfig, PreviewValue, Reference, SanityDocumentLike, SchemaType} from '@sanity/types'
import {Observable} from 'rxjs'

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
export type Selection = [Id, FieldName[]]

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
export interface PreviewableType {
  fields?: {name: string; type: SchemaType}[]
  preview?: PreviewConfig
}

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
}

/**
 * @hidden
 * @beta */
export interface PreparedSnapshot {
  type?: PreviewableType
  snapshot: PreviewValue | null | undefined
}

/** @internal */
export type ObserveDocumentTypeFromIdFn = (id: string) => Observable<string | undefined>

/**
 * @hidden
 * @beta */
export interface ObservePathsFn {
  (value: Previewable, paths: (string | PreviewPath)[], apiConfig?: ApiConfig): Observable<
    PreviewValue | SanityDocumentLike | Reference | string | null
  >
}
