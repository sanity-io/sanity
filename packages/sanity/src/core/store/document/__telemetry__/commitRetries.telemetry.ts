import {defineEvent} from '@sanity/telemetry'

export const DocumentCommitRetriesEnded = defineEvent<{
  durationMs: number
  failedAttempts: number
  lastStatusCode?: number
  outcome: 'succeeded' | 'cancelled' | 'reset' | 'torn-down'
}>({
  name: 'Document Commit Retries Ended',
  version: 1,
  description:
    'Studio stopped tracking a failed commit that was being retried with backoff because a retry succeeded, a later attempt was cancelled, a fresh snapshot replaced the buffered document or the document pair was torn down',
})
