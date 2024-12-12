import {type ReleaseType} from '../../../store'

export type ReleaseEvent =
  | CreateReleaseEvent
  | ScheduleReleaseEvent
  | UnscheduleReleaseEvent
  | PublishReleaseEvent
  | ArchiveReleaseEvent
  | UnarchiveReleaseEvent
  | AddDocumentToReleaseEvent
  | DiscardDocumentFromReleaseEvent
  | EditReleaseEvent

export type EventType = ReleaseEvent['type']

export interface BaseEvent {
  timestamp: string
  author: string
  releaseName: string
  id: string // Added client side ${event.timestamp}-${event.type}
  origin: 'translog' | 'events' // Added client side to identify from where the event was received
}

export interface CreateReleaseEvent extends BaseEvent {
  type: 'CreateRelease'
  change?: Change
}

export interface ScheduleReleaseEvent extends BaseEvent {
  type: 'ScheduleRelease'
  publishAt: string
}

export interface UnscheduleReleaseEvent extends BaseEvent {
  type: 'UnscheduleRelease'
}

export interface PublishReleaseEvent extends BaseEvent {
  type: 'PublishRelease'
}

export interface ArchiveReleaseEvent extends BaseEvent {
  type: 'ArchiveRelease'
}

export interface UnarchiveReleaseEvent extends BaseEvent {
  type: 'UnarchiveRelease'
}

export interface AddDocumentToReleaseEvent extends BaseEvent {
  type: 'AddDocumentToRelease'
  documentId: string // corresponds to documents.ID
  versionId: string // corresponds to documents.ID
  revisionId: string
  versionRevisionId: string
}

export interface DiscardDocumentFromReleaseEvent extends BaseEvent {
  type: 'DiscardDocumentFromRelease'
  documentId: string // corresponds to documents.ID
  versionId: string // corresponds to documents.ID
  versionRevisionId: string
}

interface Change {
  intendedPublishDate?: string
  releaseType?: ReleaseType
}
export interface EditReleaseEvent extends BaseEvent {
  type: 'releaseEditEvent'
  isCreationEvent?: boolean
  change: Change
}

// Type guards
export const isCreateReleaseEvent = (event: ReleaseEvent): event is CreateReleaseEvent =>
  event.type === 'CreateRelease'
export const isScheduleReleaseEvent = (event: ReleaseEvent): event is ScheduleReleaseEvent =>
  event.type === 'ScheduleRelease'
export const isUnscheduleReleaseEvent = (event: ReleaseEvent): event is UnscheduleReleaseEvent =>
  event.type === 'UnscheduleRelease'
export const isPublishReleaseEvent = (event: ReleaseEvent): event is PublishReleaseEvent =>
  event.type === 'PublishRelease'
export const isArchiveReleaseEvent = (event: ReleaseEvent): event is ArchiveReleaseEvent =>
  event.type === 'ArchiveRelease'
export const isUnarchiveReleaseEvent = (event: ReleaseEvent): event is UnarchiveReleaseEvent =>
  event.type === 'UnarchiveRelease'
export const isAddDocumentToReleaseEvent = (
  event: ReleaseEvent,
): event is AddDocumentToReleaseEvent => event.type === 'AddDocumentToRelease'
export const isDiscardDocumentFromReleaseEvent = (
  event: ReleaseEvent,
): event is DiscardDocumentFromReleaseEvent => event.type === 'DiscardDocumentFromRelease'
export const isEditReleaseEvent = (event: ReleaseEvent): event is EditReleaseEvent =>
  event.type === 'releaseEditEvent'

export const isTranslogEvent = (
  event: ReleaseEvent,
): event is EditReleaseEvent | CreateReleaseEvent => event.origin === 'translog'

export const isEventsAPIEvent = (
  event: ReleaseEvent,
): event is Exclude<ReleaseEvent, EditReleaseEvent> => event.origin === 'events'
