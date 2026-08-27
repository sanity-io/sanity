import {type Verdict} from '../stats/gate'
import {type SummaryStats} from '../stats/quantiles'

/**
 * The result document: written as the CI artifact (one per shard, merged by
 * mergeShards.ts), rendered to the PR comment (markdown.ts), and — with
 * `_id` assigned — stored as a `benchRun` document in the Studio Radar
 * project for main-branch time-series tracking.
 */
export interface BenchRunDocument {
  _type: 'benchRun'
  schemaVersion: 1
  mode: 'ab' | 'absolute'
  /**
   * Why this run happened.
   *
   * `release` is the load-bearing one: those runs measure a tagged release
   * commit, and are the only runs whose numbers can be attributed to a shipped
   * version. Everything else measures whatever main happened to be — the daily
   * `cron`, a `backfill` repairing history, a manual `dispatch`, or a `pr` run.
   *
   * Absent on documents stored before this field existed; consumers treat that
   * as `cron`, which is what the schedule wrote for all of them.
   */
  trigger?: 'cron' | 'release' | 'backfill' | 'dispatch' | 'pr'
  /**
   * Release runs only: the tag whose commit this run measured, e.g. `v6.10.1`.
   * Lets a chart anchor a release marker on this exact run instead of guessing
   * by date, and lets the run popover name the release outright.
   */
  releaseTag?: string
  git: {
    sha: string
    branch: string
    /**
     * Committer date (ISO 8601) of `sha` — the time-series x-axis. For
     * backfill runs this is the historical commit's date, not the run's;
     * `startedAt` stays the wall-clock run time. Absent on documents stored
     * before this field existed (consumers fall back to `startedAt`).
     */
    committedAt?: string
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
    /**
     * CPU model string (`os.cpus()[0].model`) — the field that discriminates
     * hosted-runner hardware generations: GitHub rotates Xeon/EPYC models
     * under the same vCPU shape, so cpus/memGb stay identical while the
     * machine (and every absolute number) changes. Absent where Node reports
     * no model.
     */
    cpuModel?: string
    /** GitHub runner image (`ImageOS` env), e.g. "ubuntu24" — CI only. */
    imageOs?: string
    /** GitHub runner image version (`ImageVersion` env) — pins when the image (toolchain, libs) rolled. */
    imageVersion?: string
    /**
     * Chromium version the sessions ran in (`browser.version()`). The browser
     * is the measuring instrument — a Playwright bump can move INP/vitals
     * with no studio change, and this is what makes that visible.
     */
    browserVersion?: string
    ci: boolean
    runId?: string
    /** CI run attempt (re-runs increment it) — for the exact Actions URL. */
    runAttempt?: number
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
  /** Repo-root-relative scenario source file, for a dashboard backlink. */
  sourceFile?: string
  /**
   * Host-speed calibration of the runner that produced THIS scenario.
   * CI runs one shard per scenario on separate runners, so the document-level
   * `runner.calibrationMs` (first shard's) doesn't apply to every scenario —
   * mergeShards stamps each scenario with its own shard's score (and CPU
   * model, since shards can land on different hardware generations). Absent
   * on single-shard/local documents (the document-level value applies).
   */
  runner?: {calibrationMs: number; cpuModel?: string}
  /**
   * How the metrics are rendered/grouped (interaction vs pageload charts).
   * Soak and INP reports reuse these kinds but are distinct measurement modes;
   * see `mode` for the unique discriminator.
   */
  kind: 'interaction' | 'pageload'
  /**
   * The measurement mode that produced this report. Defaults to `kind`, but
   * soak and INP set it explicitly so they don't collide with the plain
   * interaction/pageload reports in the same run — it's what makes the stored
   * `_key` (mode+scenario) and the shard-merge dedup unique. Without it, a
   * track-main run's soak report (kind `interaction`) and INP report (kind
   * `pageload`) key-collide with the interaction/pageLoad reports and the
   * merge throws.
   */
  mode?: 'interaction' | 'pageload' | 'soak' | 'inp'
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
  /**
   * Which elements shifted during load, with summed CLS contribution across
   * experiment samples (pageload mode only) — names the culprit behind a CLS
   * number instead of leaving it a bare score.
   */
  clsAttribution?: {source: string; totalValue: number}[]
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
  /** 'cls' is the unitless layout-shift score (~0–0.25), shown to 3 decimals. */
  unit: 'ms' | 'count' | 'cls' | 'bytes'
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
