import {PreviewConfig, PreviewValue, Reference, SanityDocumentLike, SchemaType} from '@sanity/types'
import {Observable} from 'rxjs'

export type {SortOrdering, PrepareViewOptions} from '@sanity/types'

export type Id = string

export type Previewable = (SanityDocumentLike | Reference) & {
  /**
   * optional object used to attach meta data to the prepared result.
   * currently used to add a flag for the invalid preview error fallback and
   * insufficient permissions fallback
   * @internal
   */
  _internalMeta?: {type?: string}
}

// @todo: unify with content path from @sanity/types
export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export type FieldName = string

export interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

export type AvailabilityReason = 'READABLE' | 'PERMISSION_DENIED' | 'NOT_FOUND'

export interface PreviewableType {
  fields?: {name: string; type: SchemaType}[]
  preview?: PreviewConfig
}

export interface ApiConfig {
  projectId: string
  dataset: string
}

export type DocumentAvailability =
  | {
      available: true
      reason: 'READABLE'
    }
  | {
      available: false
      reason: 'PERMISSION_DENIED' | 'NOT_FOUND'
    }

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

export interface PreparedSnapshot {
  type?: PreviewableType
  snapshot: PreviewValue | null | undefined
}

export type ObserveDocumentTypeFromIdFn = (id: string) => Observable<string | undefined>

export interface ObservePathsFn {
  (value: Previewable, paths: (string | Path)[], apiConfig?: ApiConfig): Observable<
    PreviewValue | SanityDocumentLike | Reference | string | null
  >
}
