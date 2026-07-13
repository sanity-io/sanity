/**
 * Drift acknowledgements: silence / snooze / mark-fixed, stored as `driftAck`
 * documents (shared across viewers, realtime). An ack is keyed to a metric +
 * branch and tied to the value at ack time, with a half-life so it can't hide
 * a metric forever.
 */
import {type SanityClient} from 'sanity'

export type AckState = 'silenced' | 'snoozed' | 'fixed'

export interface DriftAck {
  _id: string
  metricKey: string
  branch: string
  baselineValue: number
  state: AckState
  until: string | null
  note: string | null
  ackedAt: string
}

export const DRIFT_ACK_QUERY = `*[_type == "driftAck"]{
  _id, metricKey, branch, baselineValue, state, until, note, ackedAt
}`

/** Half-life for non-snooze acks — a silenced/fixed metric re-surfaces after this. */
const ACK_DECAY_DAYS = 30

/** Deterministic id so acking a metric/branch updates in place (idempotent). */
export function ackId(metricKey: string, branch: string): string {
  const slug = `${metricKey}:${branch}`.replace(/[^a-zA-Z0-9]+/g, '-')
  return `driftAck-${slug}`
}

/**
 * Is this ack still suppressing its entry, given the metric's current value?
 * No if: expired (snooze past `until`, or silence/fix past the decay), or the
 * metric drifted further than when it was acked (worse than baseline by 10%+).
 */
export function ackIsActive(ack: DriftAck, currentValue: number, now: number): boolean {
  if (ack.state === 'snoozed') {
    if (!ack.until || new Date(ack.until).getTime() < now) return false
  } else {
    const ackedAt = new Date(ack.ackedAt).getTime()
    if (now - ackedAt > ACK_DECAY_DAYS * 24 * 60 * 60 * 1000) return false
  }
  // Re-surface if the metric moved meaningfully past the acked value in the
  // worse direction — the ack covered a specific level, not carte blanche
  if (ack.baselineValue !== 0) {
    const worseFraction = (currentValue - ack.baselineValue) / Math.abs(ack.baselineValue)
    if (worseFraction > 0.1) return false
  }
  return true
}

export async function writeAck(
  client: SanityClient,
  input: {
    metricKey: string
    branch: string
    baselineValue: number
    state: AckState
    until?: string
    note?: string
  },
): Promise<void> {
  await client.createOrReplace({
    _id: ackId(input.metricKey, input.branch),
    _type: 'driftAck',
    metricKey: input.metricKey,
    branch: input.branch,
    baselineValue: input.baselineValue,
    state: input.state,
    until: input.until ?? null,
    note: input.note ?? null,
    ackedAt: new Date().toISOString(),
  })
}

export async function clearAck(
  client: SanityClient,
  metricKey: string,
  branch: string,
): Promise<void> {
  await client.delete(ackId(metricKey, branch))
}
