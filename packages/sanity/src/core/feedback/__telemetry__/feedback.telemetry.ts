import {defineEvent} from '@sanity/telemetry'

export const FeedbackDialogOpened = defineEvent({
  name: 'Feedback Dialog Opened',
  version: 1,
  description: 'User opened the in-studio feedback dialog',
})

export const FeedbackDialogDismissed = defineEvent({
  name: 'Feedback Dialog Dismissed',
  version: 1,
  description: 'User closed the in-studio feedback dialog without sending feedback.',
})
