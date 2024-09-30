import {defineEvent} from '@sanity/telemetry'

/**
 * When a draft in a live edit document is published
 * @internal
 */
export const AskToEditDialogOpened = defineEvent({
  name: 'Ask To Edit Dialog Opened',
  version: 1,
  description: 'User clicked the "Ask to edit" button in the document permissions banner',
})

export const AskToEditRequestSent = defineEvent({
  name: 'Ask To Edit Request Sent',
  version: 1,
  description: 'User sent a role change request from the dialog',
})
