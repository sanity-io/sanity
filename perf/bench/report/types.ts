import {type Verdict} from '../stats/gate'
import {type SummaryStats} from '../stats/quantiles'

/**
 * The result document: written as the CI artifact (one per shard, merged by
 * mergeShards.ts), rendered to the PR comment (markdown.ts), and — with
 * `_id` assigned — stored as a `benchRun` document in the studio-metrics
 * project for main-branch time-series tracking.
 */
export interface BenchRunDocument {
  _type: 'benchRun'
  schemaVersion: 1
  mode: 'ab' | 'absolute'
  git: {
    sha: string
    branch: string
    mergeBaseSha?: string
    prNumber?: number
  }
  startedAt: string
  completedAt: string
  runner: {
    os: string
    arch: string
    cpus: number
    memGb: number
    nodeVersion: string
    ci: boolean
    runId?: string
    /**
     * Host-speed score (ms for a fixed workload; higher = slower host). CPU
     * throttling is relative to host speed, so absolute numbers are only
     * comparable across runs via this score.
     */
    calibrationMs: number
  }
  config: {
    cpuThrottleRate: number
    seed: number
  }
  scenarios: ScenarioReport[]
  bundle?: {
    experiment: BundleSizes
    reference?: BundleSizes
  }
}

export interface BundleSizes {
  initialJsBytes: number
  totalJsBytes: number
  chunkCount: number
}

export interface ScenarioReport {
  scenario: string
  kind: 'interaction' | 'pageload'
  metrics: MetricReport[]
  /** Why A/B sampling stopped (absent in absolute mode). */
  stoppedBy?: 'converged' | 'budget' | 'max-sessions'
  /** Discarded-and-retried sessions — the flake telemetry. */
  failures: {side: 'reference' | 'experiment'; reason: string}[]
  /** Read-only interruption totals (see interaction session docs). */
  interruptions: {
    experiment: {count: number; totalMs: number}
    reference?: {count: number; totalMs: number}
  }
  /** Top blocking-script attributions (experiment side). */
  loafAttribution: {sourceUrl: string; functionName: string; totalMs: number}[]
  /** Resources bucket — report-only, never gated (per-session medians). */
  resources?: {
    experiment: ResourceSide
    reference?: ResourceSide
  }
  /** Soak series (soak mode only) — every value should stay flat over time. */
  soak?: {
    minutes: number
    samples: {
      minute: number
      heapMb: number
      domNodes: number
      listeners: number
      /** Median keystroke latency over the past interval (null before typing). */
      latencyP50Ms: number | null
      /** Main-thread task time during the past interval (null at minute 0). */
      cpuTaskMs: number | null
      /** Open listener connections on the mock at sample time. */
      connections: number
      /** Requests the mock served during the past interval (minute 0 = boot). */
      requests: number
    }[]
  }
}

/** Per-session medians so counts stay comparable across session counts. */
export interface ResourceSide {
  requestCount: number
  requestBytes: number
  /** Median request count per endpoint class. */
  byClass: Record<string, number>
  cpuTaskMs?: number
  cpuScriptMs?: number
  heapMb?: number
  domNodes?: number
  listeners?: number
}

export interface MetricReport {
  /** e.g. "title", "body", "boot-cold · time to editable" */
  label: string
  unit: 'ms' | 'count'
  /** Present the median as eFPS (1000/ms) in reports. */
  presentAsEfps: boolean
  experiment: SideMetric
  reference?: SideMetric
  comparison?: {
    diff: number
    lo: number
    hi: number
    verdict: Verdict
  }
}

export interface SideMetric {
  /** Per-session sample arrays (session = bootstrap resampling unit). */
  sessions: number[][]
  summary: SummaryStats
}
