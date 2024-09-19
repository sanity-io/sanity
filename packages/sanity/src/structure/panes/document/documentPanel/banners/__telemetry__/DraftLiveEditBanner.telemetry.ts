import {defineEvent} from '@sanity/telemetry'

/**
 * When a draft in a live edit document is published
 * @internal
 */
export const PublishedLiveEditDraft = defineEvent({
  name: 'Publish a draft (live edit)',
  version: 1,
  description: 'User published a draft when a draft of a live edit document to continue editing',
})

/*
 * When a draft in a live edit document is discarded
 * @internal
 */
export const DiscardedLiveEditDraft = defineEvent({
  name: 'Create a new draft',
  version: 1,
  description: 'User discarded a draft when a draft of a live edit document to continue editing',
})
