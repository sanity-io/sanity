import {defineEvent} from '@sanity/telemetry'

export const DocumentDesynced = defineEvent<{
  errorName: string
  /** Whether local mutations were pending when the pair desynced */
  hadPendingMutations?: boolean
}>({
  name: 'Document Desynced',
  version: 1,
  description:
    'Occurs when a "hole" in events from the document pair listener is detected and recovered from.',
})
