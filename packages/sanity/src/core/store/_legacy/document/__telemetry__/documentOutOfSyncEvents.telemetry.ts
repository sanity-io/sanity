import {defineEvent} from '@sanity/telemetry'

export const DocumentOutOfSync = defineEvent<{errorName: string}>({
  name: 'Document out of sync',
  version: 1,
  description: 'Occurs when a "hole" in events from the document pair listener is detected.',
})
