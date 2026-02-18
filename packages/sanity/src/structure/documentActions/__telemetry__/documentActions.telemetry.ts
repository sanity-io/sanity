import {defineEvent} from '@sanity/telemetry'

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
type PublishButtonDisabledReason =
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
// Publish outcome telemetry
// ---------------------------------------------------------------------------

interface PublishOutcomeInfo {
  /**
   * Time in milliseconds from clicking Publish to the published revision changing.
   */
  durationMs: number

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

export const PublishOutcomeTracked = defineEvent<PublishOutcomeInfo>({
  name: 'Publish Outcome Tracked',
  version: 1,
  description:
    'Tracks the duration of a successful publish operation — from clicking Publish ' +
    'to the published revision changing. Long durations indicate the "stuck" problem.',
})

// ---------------------------------------------------------------------------
// Publish button time-to-ready telemetry
// ---------------------------------------------------------------------------

export interface PublishButtonReadyInfo {
  /**
   * Time in milliseconds from the button becoming disabled (due to a mutation/sync)
   * to the button becoming enabled again.
   */
  timeToReadyMs: number

  /**
   * What caused the button to be disabled in the first place.
   */
  disabledReason: PublishButtonDisabledReason | 'unknown'

  /**
   * Whether the document was previously published
   */
  previouslyPublished: boolean
}

export const PublishButtonReady = defineEvent<PublishButtonReadyInfo>({
  name: 'Publish Button Ready',
  version: 1,
  description:
    'Tracks the time from the publish button becoming disabled (after an edit or during sync) ' +
    'to it becoming enabled and ready to use. Long durations indicate the "stuck" problem.',
})
