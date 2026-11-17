import {defineEvent} from '@sanity/telemetry'

export const DocumentCommitCancelled = defineEvent<{
  statusCode: number
  errorType?: string
}>({
  name: 'Document Commit Cancelled',
  version: 1,
  description:
    'A commit failed with a terminal status and was cancelled, resetting the buffered mutations to server HEAD',
})
