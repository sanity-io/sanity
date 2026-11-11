import {type LedgerSnapshot} from './listenerLedger'

/**
 * The connection limit a detected stall is classified against: a hardcoded listener-stream
 * budget per root API host, calibrated to the API's own HTTP/2 connection limit.
 *
 * @internal
 */
export const LISTENER_STALL_BUDGET = 80

/** @internal */
export type StallKind =
  | 'unmeasured'
  | 'not-listener-limit'
  | 'this-tab-over-limit'
  | 'this-tab-heavy'
  | 'too-many-tabs'

/**
 * Classifies a detected stall against the ledger snapshot taken when it fired and this tab's
 * own measured protocol (never a peer's - the classifier only ever has this tab's own
 * measurement available, since this tab is the one that stalled).
 *
 * @internal
 */
export function classifyStall(options: {
  snapshot: LedgerSnapshot | undefined
  protocol: string | undefined
}): StallKind {
  const {snapshot, protocol} = options
  if (!snapshot || isLegacyProtocol(protocol)) return 'unmeasured'
  if (snapshot.total < LISTENER_STALL_BUDGET) return 'not-listener-limit'

  const selfCount = snapshot.self?.count ?? 0
  if (selfCount >= LISTENER_STALL_BUDGET) {
    return snapshot.othersTotal === 0 ? 'this-tab-over-limit' : 'this-tab-heavy'
  }
  return 'too-many-tabs'
}

function isLegacyProtocol(protocol: string | undefined): boolean {
  return protocol !== undefined && (protocol.startsWith('http/0') || protocol.startsWith('http/1'))
}
