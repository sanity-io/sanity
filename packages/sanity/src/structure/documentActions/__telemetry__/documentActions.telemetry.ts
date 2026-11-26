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

interface StageInfo {
  stage: 'started' | 'completed' | 'failed'
}

export const DocumentPublished = defineEvent<DocumentPublishedInfo>({
  name: 'Document Published',
  version: 1,
  description: 'User clicked the "Publish" button in the document pane',
})

interface DocumentIdInfo {
  documentId: string
}

export const PublishButtonClicked = defineEvent<DocumentIdInfo & StageInfo>({
  name: 'Publish Button Clicked',
  version: 1,
  description: 'Logs when a publish operation is started, completed, or failed',
})

interface VariantDocumentPublishedInfo {
  /**
   * The variant already had a published version, which this publish replaced
   */
  previouslyPublished: boolean
}

/**
 * Logged when the publish operation of a document in a content variant succeeds. It does not
 * wait for {@link PublishButtonClicked} to reach `completed`, which the action can miss when the
 * pane swaps it out while the variant target re-resolves. Variant versions in a release are
 * published with the release, not from the document pane, so they never reach this event.
 */
export const VariantDocumentPublished = defineEvent<VariantDocumentPublishedInfo>({
  name: 'Variant Document Published',
  version: 1,
  description: 'User published a variant document from the document pane, outside of a release',
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

interface DocumentDeletedInfo {
  /**
   * Combines internal and cross-dataset references, and counts strong and weak
   * references together; the API does not expose a strong/weak breakdown.
   */
  referenceCount: number
  internalReferenceCount: number
  crossDatasetReferenceCount: number
}

interface DeleteStageInfo {
  /**
   * `confirmed` fires on user intent regardless of outcome; a `failed` stage
   * typically means incoming strong references blocked the deletion.
   */
  stage: 'confirmed' | 'deleted' | 'failed'
}

export const DocumentDeleted = defineEvent<DocumentIdInfo & DocumentDeletedInfo & DeleteStageInfo>({
  name: 'Document Deleted',
  version: 1,
  description:
    'Logs when a document delete is confirmed, completed, or failed, including how many documents referred to it',
})
