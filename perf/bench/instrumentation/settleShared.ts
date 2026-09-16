/**
 * Shapes and constants shared between the settle-only in-page script
 * (./settle.ts, bundled and injected — its module scope runs install() as a
 * side effect) and the runner (runner/session/settle.ts). Keep this module
 * side-effect free: the runner must be able to import the commit-bucket
 * constant without executing page-only code in node.
 */

/** Commit counts folded into 1s buckets — never one entry per commit. */
export const COMMIT_BUCKET_MS = 1000

export interface CommitBucket {
  /** Bucket start (page clock, ms), floored to whole seconds. */
  startTime: number
  /** React commits observed within [startTime, startTime + COMMIT_BUCKET_MS). */
  count: number
}

export interface SettleEntries {
  commits: CommitBucket[]
  /** False when the DevTools hook could not be installed (contract drift). */
  hookInstalled: boolean
}

export interface SettleCollector {
  version: number
  /** Drain and return everything collected since the last take(). */
  take(): SettleEntries
}

declare global {
  interface Window {
    __benchSettle?: SettleCollector
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown
  }
}
