import {defineEvent} from '@sanity/telemetry'

interface ScheduledDraftCreatedInfo {
  documentType: string
}

interface ScheduledDraftRescheduledInfo {
  /** True when resuming a paused draft, false when editing an already-scheduled date */
  fromPaused: boolean
}

interface ScheduledDraftCancelledInfo {
  /** True when the scheduled content was kept as a draft, false when discarded */
  keptAsDraft: boolean
}

/** When a scheduled draft is successfully created */
export const ScheduledDraftCreated = defineEvent<ScheduledDraftCreatedInfo>({
  name: 'Scheduled Draft Created',
  version: 1,
  description: 'User scheduled a draft for publishing',
})

/** When a scheduled draft is successfully rescheduled */
export const ScheduledDraftRescheduled = defineEvent<ScheduledDraftRescheduledInfo>({
  name: 'Scheduled Draft Rescheduled',
  version: 1,
  description: 'User changed the publish time of a scheduled draft',
})

/** When a scheduled draft is successfully cancelled */
export const ScheduledDraftCancelled = defineEvent<ScheduledDraftCancelledInfo>({
  name: 'Scheduled Draft Cancelled',
  version: 1,
  description: 'User cancelled a scheduled draft',
})
