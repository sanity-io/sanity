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

/** Traces a publish operation from click to revision change */
export const TimeToPublishTrace = defineTrace({
  name: 'Time to Publish',
  version: 1,
  description: 'Traces a publish operation from click to completion',
})

/** Traces the time from the publish button becoming disabled to becoming enabled */
export const PublishButtonDisabledToEnabledTrace = defineTrace({
  name: 'Publish Button Disabled to Enabled',
  version: 1,
  description: 'Traces the publish button from disabled to enabled again',
})
