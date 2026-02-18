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
  isDisabled: boolean
  disabledReasons: PublishButtonDisabledReason[]
  buttonLabel: 'publish' | 'publishing' | 'published' | 'waiting'
}

/** When the publish button transitions between enabled/disabled states */
export const PublishButtonStateChanged = defineEvent<PublishButtonStateChangedInfo>({
  name: 'Publish Button State Changed',
  version: 1,
  description: 'Publish button transitioned between enabled/disabled states',
})

/** Traces a publish operation from click to revision change */
export const TimeToPublishTrace = defineTrace({
  name: 'Time to Publish',
  version: 1,
  description: 'Traces a publish operation from click to completion',
})

interface PublishButtonReadyData {
  disabledReason: PublishButtonDisabledReason | 'unknown'
}

/** Traces the time from the publish button becoming disabled to becoming enabled */
export const PublishButtonReadyTrace = defineTrace<PublishButtonReadyData>({
  name: 'Publish Button Ready',
  version: 1,
  description: 'Traces the publish button from disabled to enabled again',
})
