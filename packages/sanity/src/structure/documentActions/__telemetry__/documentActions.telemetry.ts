import {defineEvent, defineTrace} from '@sanity/telemetry'

interface DocumentPublishedInfo {
  /**
   * The document was created and published straight away
   */
  publishedImmediately: boolean

  /**
   * The document had a previously published version when it was published
   */
  previouslyPublished: boolean
}
export const DocumentPublished = defineEvent<DocumentPublishedInfo>({
  name: 'Document Published',
  version: 1,
  description: 'User clicked the "Publish" button in the document pane',
})

// ---------------------------------------------------------------------------
// Publish button state telemetry
// ---------------------------------------------------------------------------

/**
 * Reasons the publish button can be disabled.
 * Maps to the internal disabled reasons from the publish operation,
 * plus additional UI-level reasons.
 */
export type PublishButtonDisabledReason =
  | 'LIVE_EDIT_ENABLED'
  | 'ALREADY_PUBLISHED'
  | 'NO_CHANGES'
  | 'NOT_READY'
  | 'VALIDATION_ERROR'
  | 'SYNCING'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'PUBLISH_SCHEDULED'
  | 'TRANSACTION_SYNC_LOCK'
  | 'PERMISSIONS_LOADING'
  | 'PERMISSION_DENIED'

export interface PublishButtonStateChangedInfo {
  /**
   * Whether the publish button is currently disabled
   */
  isDisabled: boolean

  /**
   * The reason(s) the button is disabled, if applicable.
   * Multiple reasons can apply simultaneously.
   */
  disabledReasons: PublishButtonDisabledReason[]

  /**
   * The label currently shown on the button (e.g. "Publish", "Publishing…", "Published")
   */
  buttonLabel: 'publish' | 'publishing' | 'published' | 'waiting'
}

export const PublishButtonStateChanged = defineEvent<PublishButtonStateChangedInfo>({
  name: 'Publish Button State Changed',
  version: 1,
  description:
    'The publish button transitioned between enabled/disabled states. ' +
    'Tracks the reason for each state to identify patterns causing the button to remain disabled.',
  maxSampleRate: 500,
})

// ---------------------------------------------------------------------------
// Publish outcome trace
// ---------------------------------------------------------------------------

/**
 * Data logged as intermediate steps during the publish trace.
 * Logged via trace.log() when the publish outcome is determined.
 */
export interface PublishOutcomeData {
  /**
   * Whether the document had been previously published
   */
  previouslyPublished: boolean

  /**
   * Whether syncing was still in progress when the user clicked Publish
   * (i.e. the publish was "scheduled" to run after sync completed)
   */
  wasScheduledWhileSyncing: boolean
}

/**
 * Traces the full publish operation — from clicking Publish to the published
 * revision changing. The backend computes duration from trace.start → trace.complete
 * timestamps. Long durations indicate the "stuck on Publishing" problem.
 */
export const PublishOutcomeTrace = defineTrace<PublishOutcomeData>({
  name: 'Publish Outcome',
  version: 2,
  description:
    'Traces a publish operation from click to completion. ' +
    'Duration is computed from trace.start → trace.complete timestamps.',
})

// ---------------------------------------------------------------------------
// Publish button time-to-ready trace
// ---------------------------------------------------------------------------

/**
 * Data logged as intermediate steps during the time-to-ready trace.
 * Logged via trace.log() when the button becomes enabled again.
 */
export interface PublishButtonReadyData {
  /**
   * What caused the button to be disabled in the first place.
   */
  disabledReason: PublishButtonDisabledReason | 'unknown'

  /**
   * Whether the document was previously published
   */
  previouslyPublished: boolean
}

/**
 * Traces the time from the publish button becoming disabled (after an edit
 * or during sync) to it becoming enabled and ready to use. The backend
 * computes duration from trace.start → trace.complete timestamps.
 * Long durations indicate the "stuck" problem.
 */
export const PublishButtonReadyTrace = defineTrace<PublishButtonReadyData>({
  name: 'Publish Button Ready',
  version: 2,
  description:
    'Traces the time from the publish button becoming disabled to becoming enabled again. ' +
    'Duration is computed from trace.start → trace.complete timestamps.',
})
