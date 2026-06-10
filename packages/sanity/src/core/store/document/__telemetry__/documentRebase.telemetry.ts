import {defineEvent} from '@sanity/telemetry'

export const DocumentRebaseOccurred = defineEvent<{
  remoteMutationCount: number
  localMutationCount: number
}>({
  name: 'Document Rebase Occurred',
  version: 1,
  description:
    'A remote mutation arrived while local mutations were pending, requiring a rebase of the optimistic state',
})
