import {defineEvent} from '@sanity/telemetry'

type Samples = {
  latency: number
  transactionId: string
  shard?: string
}
export const HighListenerLatencyOccurred = defineEvent<Samples>({
  name: 'High Listener Latency Detected',
  version: 1,
  description: 'Emits when a high listener latency is detected',
})
