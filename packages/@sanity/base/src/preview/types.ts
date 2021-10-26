import {Reference} from '@sanity/types'

export {PrepareViewOptions} from '@sanity/types'
export {SortOrdering} from '@sanity/types'

export type Id = string

export type {Reference}
export type Document = {_id: string; [key: string]: unknown}

export type Value = Document | Record<string, unknown> | Reference | Id

// @todo: unify with content path from @sanity/types
export type Path = FieldName[]
export type Selection = [Id, Path[]]
export type FieldName = string

export enum AvailabilityReason {
  READABLE = 'READABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
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
