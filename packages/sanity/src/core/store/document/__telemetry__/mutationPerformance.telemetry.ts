import {defineEvent} from '@sanity/telemetry'

export const MutationPerformanceMeasured = defineEvent<{
  transactionId: string
  debounceMs: number
  apiMs: number
  callbackMs: number
  shard?: string
}>({
  name: 'Mutation Performance Measured',
  version: 1,
  description:
    'Timing breakdown for mutation round-trip: debounce, API, and listener callback phases',
})
