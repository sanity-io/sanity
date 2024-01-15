import {defineEvent} from '@sanity/telemetry'

export const DocumentPublished = defineEvent({
  name: 'Document Published',
  version: 1,
  description: 'User clicked the "Publish" button in the document pane',
})
