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
  type: 'createRelease'
  change?: Change
}

export interface ScheduleReleaseEvent extends BaseEvent {
  type: 'scheduleRelease'
  publishAt: string
}

export interface UnscheduleReleaseEvent extends BaseEvent {
  type: 'unscheduleRelease'
}

export interface PublishReleaseEvent extends BaseEvent {
  type: 'publishRelease'
}

export interface ArchiveReleaseEvent extends BaseEvent {
  type: 'archiveRelease'
}

export interface UnarchiveReleaseEvent extends BaseEvent {
  type: 'unarchiveRelease'
}

export interface AddDocumentToReleaseEvent extends BaseEvent {
  type: 'addDocumentToRelease'
  documentId: string
  documentType: string
  versionId: string
  revisionId: string
  versionRevisionId: string
}

export interface DiscardDocumentFromReleaseEvent extends BaseEvent {
  type: 'discardDocumentFromRelease'
  documentId: string
  documentType: string
  versionId: string
  versionRevisionId: string
}

interface Change {
  intendedPublishDate?: string
  releaseType?: ReleaseType
}
export interface EditReleaseEvent extends BaseEvent {
  type: 'editRelease'
  isCreationEvent?: boolean
  change: Change
}

// Type guards
export const isCreateReleaseEvent = (event: ReleaseEvent): event is CreateReleaseEvent =>
  event.type === 'createRelease'
export const isScheduleReleaseEvent = (event: ReleaseEvent): event is ScheduleReleaseEvent =>
  event.type === 'scheduleRelease'
export const isUnscheduleReleaseEvent = (event: ReleaseEvent): event is UnscheduleReleaseEvent =>
  event.type === 'unscheduleRelease'
export const isPublishReleaseEvent = (event: ReleaseEvent): event is PublishReleaseEvent =>
  event.type === 'publishRelease'
export const isArchiveReleaseEvent = (event: ReleaseEvent): event is ArchiveReleaseEvent =>
  event.type === 'archiveRelease'
export const isUnarchiveReleaseEvent = (event: ReleaseEvent): event is UnarchiveReleaseEvent =>
  event.type === 'unarchiveRelease'
export const isAddDocumentToReleaseEvent = (
  event: ReleaseEvent,
): event is AddDocumentToReleaseEvent => event.type === 'addDocumentToRelease'
export const isDiscardDocumentFromReleaseEvent = (
  event: ReleaseEvent,
): event is DiscardDocumentFromReleaseEvent => event.type === 'discardDocumentFromRelease'
export const isEditReleaseEvent = (event: ReleaseEvent): event is EditReleaseEvent =>
  event.type === 'editRelease'

export const isTranslogEvent = (
  event: ReleaseEvent,
): event is EditReleaseEvent | CreateReleaseEvent => event.origin === 'translog'

export const isEventsAPIEvent = (
  event: ReleaseEvent,
): event is Exclude<ReleaseEvent, EditReleaseEvent> => event.origin === 'events'
