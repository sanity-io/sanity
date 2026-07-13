/**
 * Request ledger — the "resources" metric source and the mock-drift detector.
 *
 * Every request the mock serves is recorded (endpoint class, method, bytes
 * in/out); requests that match no known endpoint are additionally recorded as
 * `unexpected` unless allowlisted. The runner reads the ledger per session
 * via `GET /_bench/requests` and fails the session on unexpected entries —
 * "the studio started calling a new endpoint" must be a named failure, not a
 * mysterious hang (see README: flake resistance).
 */

export interface LedgerEntry {
  method: string
  path: string
  /** Coarse endpoint class used for request-count reporting. */
  endpointClass: string
  bytesIn: number
  bytesOut: number
  at: number
}

export interface UnexpectedRequest {
  method: string
  path: string
  at: number
}

/**
 * Endpoints the studio may call that the mock deliberately does not
 * implement — verified to degrade gracefully (see README). These 404 without
 * failing the session.
 */
const UNIMPLEMENTED_BUT_GRACEFUL = [
  /^\/v[^/]+\/users\/me\/keyvalue/, // UI state persistence — .catch()ed in serverStorage.ts
  /^\/v[^/]+\/socket\//, // bifur websocket fallback probes — presence degrades
  /^\/v[^/]+\/comments\//, // comments addon setup — gated off via /features
  /^\/v[^/]+\/data\/history\//, // timeline — lazy, inspector-only
  /^\/v[^/]+\/data\/events\//, // events API — lazy, inspector-only
  /^\/v[^/]+\/data\/transactions\//, // translog — lazy, inspector-only
  /^\/v[^/]+\/intake\//, // telemetry — fire-and-forget
]

export class RequestLedger {
  private entries: LedgerEntry[] = []
  private unexpected: UnexpectedRequest[] = []

  record(entry: LedgerEntry): void {
    this.entries.push(entry)
  }

  recordUnexpected(method: string, path: string): void {
    if (UNIMPLEMENTED_BUT_GRACEFUL.some((pattern) => pattern.test(path))) {
      return
    }
    this.unexpected.push({method, path, at: Date.now()})
  }

  snapshot(): {entries: LedgerEntry[]; unexpected: UnexpectedRequest[]} {
    return {entries: [...this.entries], unexpected: [...this.unexpected]}
  }

  reset(): void {
    this.entries = []
    this.unexpected = []
  }
}
