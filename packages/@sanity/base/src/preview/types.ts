import {PreviewConfig, PreviewValue, SanityDocument, SchemaType} from '@sanity/types'
import {Observable} from 'rxjs'

export type {SortOrdering, PrepareViewOptions} from '@sanity/types'

export type Id = string

export type Reference = {_ref: string}
export type Document = {_id: string; [key: string]: unknown}

export type Previewable = Document | Reference

// @todo: unify with content path from @sanity/types
export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export type FieldName = string

export interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

export enum AvailabilityReason {
  READABLE = 'READABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
}

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
      reason: AvailabilityReason.READABLE
    }
  | {
      available: false
      reason: AvailabilityReason.PERMISSION_DENIED | AvailabilityReason.NOT_FOUND
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

export interface DraftsModelDocument<T extends DocumentPreview = DocumentPreview> {
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

export interface DocumentPreview {
  _id: string
  _type: string
  _updatedAt?: string
  _createdAt?: string
  _rev?: string
}

export interface PreparedSnapshot {
  type?: PreviewableType
  snapshot: undefined | PreviewValue
}

export type ObserveDocumentTypeFromIdFn = (id: string) => Observable<string | undefined>

export interface ObservePathsFn {
  (value: Previewable | Id, paths: (string | Path)[], apiConfig?: ApiConfig): Observable<
    Partial<SanityDocument> | Reference | string | null
  >
}
