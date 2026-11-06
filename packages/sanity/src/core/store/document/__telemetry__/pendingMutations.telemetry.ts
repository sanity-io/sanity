import {defineEvent} from '@sanity/telemetry'

export const DocumentPairTornDownWithPendingMutations = defineEvent({
  name: 'Document Pair Torn Down With Pending Mutations',
  version: 1,
  description: 'A document pair was torn down while local mutations were pending',
})
