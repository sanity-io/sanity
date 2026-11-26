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
   * Number of mutations received after a resume until the next connection event.
   * Includes both replayed mutations from catch-up and any live mutations that
   * arrive before the next reconnect/reset. Zero means no mutations were received.
   */
  mutationsAfterResumeCount: number
  /** The shard that handled the connection, if known */
  shard?: string
}

/**
 * Emitted after a listener resumes, counting mutations received until the next connection event.
 * This measures mutations after welcomeback until the next reconnect/reset - it includes both
 * catch-up replay and any live mutations that arrive in that window.
 * @internal
 */
export const ListenerResumePayloadMeasured = defineEvent<ListenerResumePayloadMeasuredData>({
  name: 'Listener Resume Payload Measured',
  version: 1,
  description:
    'Number of mutations received after a listener resumes until the next connection event',
})
