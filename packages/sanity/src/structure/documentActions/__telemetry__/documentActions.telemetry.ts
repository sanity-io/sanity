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

interface PublishButtonDisabledInfo {
  /**
   * Associated with a remote event
   * Specifically with the condition editState?.transactionSyncLock?.enabled for publishing a document
   * Which can be triggered by a remote event
   */
  isRemoteEvent: boolean
}

export const DocumentPublished = defineEvent<DocumentPublishedInfo>({
  name: 'Document Published',
  version: 1,
  description: 'User clicked the "Publish" button in the document pane',
})

interface DocumentIdInfo {
  documentId: string
}

export const TimeToPublishStart = defineEvent<DocumentIdInfo>({
  name: 'Publish Button Clicked - Started',
  version: 1,
  description: 'Logs when a publish operation starts (user clicks publish)',
})

export const TimeToPublishComplete = defineEvent<DocumentIdInfo>({
  name: 'Publish Button Clicked - Completed',
  version: 1,
  description: 'Logs when a publish operation completes (revision change confirmed)',
})

export const PublishButtonDisabledStart = defineEvent<DocumentIdInfo & PublishButtonDisabledInfo>({
  name: 'Publish Button Becomes Disabled - Started',
  version: 1,
  description: 'Logs when the publish button becomes disabled',
})

export const PublishButtonDisabledComplete = defineEvent<
  DocumentIdInfo & PublishButtonDisabledInfo
>({
  name: 'Publish Button Becomes Disabled - Completed',
  version: 1,
  description: 'Logs when the publish button becomes enabled again',
})
