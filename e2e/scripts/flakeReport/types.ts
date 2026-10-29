/** A GitHub Actions workflow run as returned by the REST API, reduced to what the report needs. */
export interface WorkflowRun {
  attempt: number
  branch: string
  conclusion: string | null
  createdAt: string
  event: string
  id: number
  prNumber?: number
  status: string
  title: string
  url: string
}

export interface WorkflowJob {
  conclusion: string | null
  id: number
  name: string
  url: string
}

export interface Artifact {
  expired: boolean
  id: number
  name: string
  sizeInBytes: number
}

/**
 * The subset of the Studio diagnostics report (`StudioDiagnostics` in the `sanity`
 * package, `diagnosticVersion: 1`) the classifier reads. Kept structural so this
 * package does not need to depend on `sanity`.
 */
export interface DiagnosticsReport {
  diagnosticVersion: 1
  durationMs: number
  generatedAt: string
  network: {
    geoIpCountry?: string | null
    listen: {first: ListenProbe; secondWhileFirstOpen: ListenProbe}
    protocol: {durationMs: number; protocol: string; status: string; timedOut: boolean}
    requestHistory: {
      entries: HistoryEntry[]
      sessionSummary: {buckets: BucketSummary[]; startedAt: string; totalRequests: number}
      totalRequests: number
    }
    requests: RequestProbe[]
    shard?: string
  }
  startedAt: string
  studio: {apiHost?: string; dataset: string; location?: string; projectId: string; version: string}
}

export interface ListenProbe {
  durationMs: number
  error?: string
  openMs?: number
  status: 'success' | 'timeout' | 'error'
  welcomeMs?: number
}

export interface RequestProbe {
  detail?: string
  durationMs: number
  error?: string
  path: string
  shard?: string
  status: 'success' | 'timeout' | 'error'
}

export interface HistoryEntry {
  apiVersion: string
  bucket: string
  dataset: string
  durationMs: number
  projectId: string
  startedAt: string
  status: 'success' | 'error' | 'aborted'
}

export interface BucketSummary {
  bucket: string
  count: number
  maxMs: number
  medianMs: number
  p95Ms: number
}

/** Plain-fetch probes attached when the studio shell never mounted (see e2e/helpers/failureDiagnostics.ts). */
export interface FallbackReport {
  fallbackVersion: 1
  generatedAt: string
  location: string
  online?: boolean
  probes: FallbackProbe[]
  reason: string
}

export interface FallbackProbe {
  authenticated: boolean
  durationMs: number
  error?: string
  path: string
  shard?: string
  status?: number
}

/** One attempt (initial run or retry) of one test inside one shard's blob report. */
export interface AttemptCapture {
  attempt: number
  diagnostics?: DiagnosticsReport
  errorText?: string
  fallback?: FallbackReport
  kind: 'studio' | 'fallback' | 'error' | 'none'
  /** Text of the studio's request error dialog (rate limited / server error / network error) if it was showing. */
  requestErrorText?: string
  status: string
}

/** What the browser saw at failure time: was the API degraded, healthy, or is there no data. */
export type Verdict = 'degraded' | 'healthy' | 'unknown'

export interface AttemptAnalysis extends AttemptCapture {
  evidence: string[]
  verdict: Verdict
}

export interface TestAnalysis {
  attempts: AttemptAnalysis[]
  /** `failed` when the last attempt failed; `flaky` when a retry eventually passed. */
  outcome: 'failed' | 'flaky'
  shard: string
  title: string
}

export type LogSignature = 'rate-limit' | 'network' | 'other'

/** A failed job outside the Playwright matrix (dataset setup, preview deploy, report merge). */
export interface SetupFailure {
  excerpt?: string
  job: string
  signature: LogSignature
  url: string
}

/**
 * Run-level attribution.
 * - `platform`: every hard-failed test (or the failing setup job) shows API degradation.
 * - `test-side`: the API was healthy on the final failed attempt of every hard-failed test.
 * - `mixed`: some of each.
 * - `unknown`: no diagnostics data to decide.
 */
export type RunVerdict = 'platform' | 'test-side' | 'mixed' | 'unknown'

export interface RunAnalysis {
  /** Whether diagnostics captures were available for the failing shards. */
  coverage: 'captured' | 'partial' | 'none' | 'not-applicable'
  failedJobs: string[]
  reasons: string[]
  run: WorkflowRun
  setupFailures: SetupFailure[]
  tests: TestAnalysis[]
  verdict: RunVerdict
}

/** Failed runs close together in time across unrelated branches: a platform-wide signal. */
export interface FailureCluster {
  branches: string[]
  end: string
  runs: RunAnalysis[]
  start: string
}

export interface Thresholds {
  clusterGapMs: number
  clusterMinBranches: number
  clusterMinRuns: number
  historyErrorCount: number
  minSampleForPercentiles: number
  slowMedianMs: number
  slowP95Ms: number
  slowProbeMs: number
  slowRequestMs: number
}

export interface FlakeReport {
  clusters: FailureCluster[]
  failed: RunAnalysis[]
  generatedAt: string
  repo: string
  runs: WorkflowRun[]
  since: string
  thresholds: Thresholds
  until: string
  workflow: string
}
