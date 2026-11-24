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

/** @internal */
export interface ListenerWelcomeTimeMeasuredData {
  /** Time in milliseconds from listener subscription to welcome event */
  durationMs: number
  /** The shard that handled the connection, if known */
  shard?: string
}

/**
 * Emitted when a listener receives its welcome event, measuring the connection setup time.
 * @internal
 */
export const ListenerWelcomeTimeMeasured = defineEvent<ListenerWelcomeTimeMeasuredData>({
  name: 'Listener Welcome Time Measured',
  version: 1,
  description: 'Time from listener subscription until welcome event is received',
})

/** @internal */
export interface ListenerResumeTimeMeasuredData {
  /** Time in milliseconds from reconnect to welcomeback event */
  durationMs: number
  /** The shard that handled the connection, if known */
  shard?: string
}

/**
 * Emitted when a listener successfully resumes after a reconnection, measuring the resume time.
 * @internal
 */
export const ListenerResumeTimeMeasured = defineEvent<ListenerResumeTimeMeasuredData>({
  name: 'Listener Resume Time Measured',
  version: 1,
  description: 'Time from reconnect until welcomeback event is received',
})

/** @internal */
export interface ListenerResumePayloadMeasuredData {
  /**
   * Number of replayed mutations received after a resume.
   * This is a proxy for payload size - zero means no catch-up was needed.
   */
  replayedMutationCount: number
  /** The shard that handled the connection, if known */
  shard?: string
}

/**
 * Emitted after a listener resumes, measuring the payload replayed to catch up.
 * A count of zero indicates no mutations were buffered during the disconnect.
 * @internal
 */
export const ListenerResumePayloadMeasured = defineEvent<ListenerResumePayloadMeasuredData>({
  name: 'Listener Resume Payload Measured',
  version: 1,
  description: 'Number of mutations replayed when a listener resumes from its last position',
})
