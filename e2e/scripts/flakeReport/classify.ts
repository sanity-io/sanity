import {
  type AttemptAnalysis,
  type AttemptCapture,
  type FailureCluster,
  type LogSignature,
  type RunAnalysis,
  type RunVerdict,
  type SetupFailure,
  type TestAnalysis,
  type Thresholds,
  type WorkflowJob,
  type WorkflowRun,
} from './types'

/**
 * Healthy staging traffic from a CI runner sits well under a second per request
 * (query medians of 100–350 ms, probes 20–500 ms). The thresholds below flag the
 * spikes seen in incident traces (multi-second TTFBs, timeouts, 429s) without
 * tripping on ordinary cross-region variance.
 */
export const DEFAULT_THRESHOLDS: Thresholds = {
  clusterGapMs: 30 * 60 * 1000,
  clusterMinBranches: 3,
  clusterMinRuns: 3,
  historyErrorCount: 3,
  minSampleForPercentiles: 5,
  slowMedianMs: 1000,
  slowP95Ms: 2500,
  slowProbeMs: 1500,
  slowRequestMs: 3000,
}

const FAILED_STATUSES = new Set(['failed', 'timedOut', 'interrupted'])

function ms(value: number): string {
  return `${Math.round(value)} ms`
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? 0
}

/** Decides whether one failed attempt's capture shows a degraded API, and why. */
export function classifyAttempt(
  capture: AttemptCapture,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): AttemptAnalysis {
  if (capture.kind === 'studio' && capture.diagnostics) {
    return {...capture, ...classifyStudioCapture(capture, thresholds)}
  }
  if (capture.kind === 'fallback' && capture.fallback) {
    return {...capture, ...classifyFallbackCapture(capture, thresholds)}
  }
  if (capture.kind === 'error') {
    return {
      ...capture,
      evidence: [capture.errorText ?? 'diagnostics capture failed'],
      verdict: 'unknown',
    }
  }
  return {...capture, evidence: ['no diagnostics attachment'], verdict: 'unknown'}
}

function classifyStudioCapture(
  capture: AttemptCapture,
  thresholds: Thresholds,
): Pick<AttemptAnalysis, 'evidence' | 'verdict'> {
  const {network} = capture.diagnostics!
  const evidence: string[] = []
  let degraded = false
  const flag = (reason: string) => {
    degraded = true
    evidence.push(reason)
  }

  for (const probe of network.requests) {
    if (probe.status !== 'success') {
      flag(`probe ${probe.path} ${probe.status}${probe.error ? ` (${probe.error})` : ''}`)
    } else if (probe.durationMs > thresholds.slowProbeMs) {
      flag(`probe ${probe.path} took ${ms(probe.durationMs)}`)
    }
  }

  const listenProbes: [string, typeof network.listen.first][] = [
    ['listen', network.listen.first],
    ['second listen', network.listen.secondWhileFirstOpen],
  ]
  for (const [label, probe] of listenProbes) {
    if (probe.status !== 'success') {
      flag(`${label} ${probe.status}${probe.error ? ` (${probe.error})` : ''}`)
    }
  }
  if (network.protocol.status === 'timeout' || network.protocol.status === 'error') {
    flag(`protocol probe ${network.protocol.status}`)
  }

  const {entries, sessionSummary} = network.requestHistory
  const errors = entries.filter((entry) => entry.status === 'error')
  if (errors.length >= thresholds.historyErrorCount) {
    flag(`${errors.length} API requests failed during the test`)
  } else if (errors.length > 0) {
    evidence.push(
      `${errors.length} API request${errors.length === 1 ? '' : 's'} failed during the test`,
    )
  }

  const slowest = entries.reduce<(typeof entries)[number] | undefined>(
    (current, entry) => (!current || entry.durationMs > current.durationMs ? entry : current),
    undefined,
  )
  if (slowest && slowest.durationMs > thresholds.slowRequestMs) {
    flag(`${slowest.bucket} request took ${ms(slowest.durationMs)}`)
  }

  for (const bucket of sessionSummary.buckets) {
    if (bucket.count < thresholds.minSampleForPercentiles) continue
    if (bucket.medianMs > thresholds.slowMedianMs) {
      flag(`${bucket.bucket} median ${ms(bucket.medianMs)} over ${bucket.count} requests`)
    } else if (bucket.p95Ms > thresholds.slowP95Ms) {
      flag(`${bucket.bucket} p95 ${ms(bucket.p95Ms)} over ${bucket.count} requests`)
    }
  }

  if (!degraded) {
    const queryDurations = entries
      .filter((entry) => entry.bucket === 'query' && entry.status === 'success')
      .map((entry) => entry.durationMs)
    const probeDurations = network.requests.map((probe) => probe.durationMs)
    const summary =
      queryDurations.length > 0
        ? `query median ${ms(percentile(queryDurations, 0.5))}, p95 ${ms(percentile(queryDurations, 0.95))} over ${queryDurations.length} requests`
        : `${entries.length} recorded requests`
    evidence.unshift(
      `API healthy: ${summary}; probes ${ms(Math.min(...probeDurations))}–${ms(Math.max(...probeDurations))}`,
    )
  }

  return {evidence, verdict: degraded ? 'degraded' : 'healthy'}
}

function classifyFallbackCapture(
  capture: AttemptCapture,
  thresholds: Thresholds,
): Pick<AttemptAnalysis, 'evidence' | 'verdict'> {
  const {probes, reason} = capture.fallback!
  const evidence: string[] = []
  let degraded = false

  for (const probe of probes) {
    if (probe.error) {
      degraded = true
      evidence.push(`fallback probe ${probe.path}: ${probe.error}`)
    } else if (probe.status === 429 || (probe.status !== undefined && probe.status >= 500)) {
      degraded = true
      evidence.push(`fallback probe ${probe.path} → HTTP ${probe.status}`)
    } else if (probe.durationMs > thresholds.slowProbeMs) {
      degraded = true
      evidence.push(`fallback probe ${probe.path} took ${ms(probe.durationMs)}`)
    }
  }

  if (!degraded) {
    const summary = probes.map(
      (probe) => `${probe.path} ${probe.status ?? '?'} in ${ms(probe.durationMs)}`,
    )
    evidence.push(`studio shell never mounted, but the API answered: ${summary.join(', ')}`)
  }
  evidence.push(reason)

  return {evidence, verdict: degraded ? 'degraded' : 'healthy'}
}

/** Tests from one shard that failed at least once, with each failed attempt classified. */
export function analyzeTests(
  shard: string,
  tests: {attempts: AttemptCapture[]; title: string}[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): TestAnalysis[] {
  const analyses: TestAnalysis[] = []
  for (const test of tests) {
    const failedAttempts = test.attempts.filter((attempt) => FAILED_STATUSES.has(attempt.status))
    if (failedAttempts.length === 0) continue
    const last = test.attempts[test.attempts.length - 1]
    analyses.push({
      attempts: failedAttempts.map((attempt) => classifyAttempt(attempt, thresholds)),
      outcome: last && FAILED_STATUSES.has(last.status) ? 'failed' : 'flaky',
      shard,
      title: test.title,
    })
  }
  return analyses
}

// Status codes are only trusted next to an HTTP/status marker: bare numbers show up in
// unrelated places (`pnpm` progress lines like "added 429", `duration_ms=502`).
const STATUS_MARKER = String.raw`(?:HTTP\/?[\d.]*\s*|status(?:Code)?\s*[:=]?\s*|\()`
const LOG_SIGNATURES: [LogSignature, RegExp][] = [
  ['rate-limit', new RegExp(String.raw`rate ?limit|Too Many Requests|${STATUS_MARKER}429\b`, 'i')],
  [
    'network',
    new RegExp(
      String.raw`ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|fetch failed|Bad Gateway|Service Unavailable|Gateway Time-?out|${STATUS_MARKER}50[234]\b`,
      'i',
    ),
  ],
]

/** Classifies a failed non-Playwright job (dataset setup, deploy) from its log text. */
export function classifyJobLog(log: string): {excerpt?: string; signature: LogSignature} {
  const lines = log.split('\n')
  for (const [signature, pattern] of LOG_SIGNATURES) {
    const match = lines.find((line) => pattern.test(line))
    if (match) return {excerpt: cleanLogLine(match), signature}
  }
  const errorLine = lines.find((line) => /##\[error\]|\bError\b/.test(line))
  return {excerpt: errorLine ? cleanLogLine(errorLine) : undefined, signature: 'other'}
}

function cleanLogLine(line: string): string {
  return line
    .replace(/^\S+\t/, '')
    .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/, '')
    .replace(/##\[error\]/, '')
    .trim()
    .slice(0, 200)
}

const lastFailedAttempt = (test: TestAnalysis): AttemptAnalysis | undefined =>
  test.attempts[test.attempts.length - 1]

/** Attributes a failed run to the platform, to the tests, or to neither for lack of data. */
export function classifyRun(
  run: WorkflowRun,
  jobs: WorkflowJob[],
  tests: TestAnalysis[],
  setupFailures: SetupFailure[],
): RunAnalysis {
  const failedJobs = jobs.filter((job) => job.conclusion === 'failure').map((job) => job.name)
  const playwrightFailed = failedJobs.some((name) => name.startsWith('playwright-test'))
  const hardFailed = tests.filter((test) => test.outcome === 'failed')
  const reasons: string[] = []

  let verdict: RunVerdict = 'unknown'
  let coverage: RunAnalysis['coverage'] = 'not-applicable'

  if (playwrightFailed) {
    if (hardFailed.length === 0) {
      coverage = 'none'
      reasons.push(
        'failed Playwright shards had no readable blob report (artifact expired or missing)',
      )
    } else {
      const finals = hardFailed.map((test) => ({test, attempt: lastFailedAttempt(test)}))
      const captured = finals.filter(({attempt}) => attempt && attempt.verdict !== 'unknown')
      coverage =
        captured.length === finals.length ? 'captured' : captured.length > 0 ? 'partial' : 'none'

      const degraded = captured.filter(({attempt}) => attempt!.verdict === 'degraded')
      const healthy = captured.filter(({attempt}) => attempt!.verdict === 'healthy')
      if (captured.length === 0) {
        reasons.push('no diagnostics attachments on the failed attempts')
      } else if (degraded.length > 0 && healthy.length === 0) {
        verdict = 'platform'
      } else if (healthy.length > 0 && degraded.length === 0) {
        verdict = 'test-side'
      } else {
        verdict = 'mixed'
      }

      for (const {test, attempt} of finals) {
        const detail = attempt?.evidence[0] ?? 'no data'
        reasons.push(`${test.title} [${test.shard}]: ${attempt?.verdict ?? 'unknown'} — ${detail}`)
        const first = test.attempts[0]
        if (
          first &&
          attempt &&
          first !== attempt &&
          first.verdict === 'degraded' &&
          attempt.verdict === 'healthy'
        ) {
          reasons.push(
            `  ↳ first attempt ran during API degradation (${first.evidence[0]}); later attempts saw a healthy API and still failed`,
          )
        }
      }
    }
  } else if (setupFailures.length > 0) {
    const platformSignature = setupFailures.find(
      (failure) => failure.signature === 'rate-limit' || failure.signature === 'network',
    )
    verdict = platformSignature ? 'platform' : 'unknown'
    for (const failure of setupFailures) {
      reasons.push(
        `${failure.job}: ${failure.signature}${failure.excerpt ? ` — ${failure.excerpt}` : ''}`,
      )
    }
  } else {
    reasons.push(`no failed jobs recorded (run conclusion: ${run.conclusion ?? 'unknown'})`)
  }

  return {coverage, failedJobs, reasons, run, setupFailures, tests, verdict}
}

/**
 * Groups failed runs that started within `clusterGapMs` of the previous failed run.
 * A cluster spanning several unrelated branches cannot be explained by any one PR's code.
 */
export function findClusters(
  failed: RunAnalysis[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): FailureCluster[] {
  const sorted = [...failed].sort((left, right) =>
    left.run.createdAt.localeCompare(right.run.createdAt),
  )
  const clusters: RunAnalysis[][] = []
  for (const analysis of sorted) {
    const current = clusters[clusters.length - 1]
    const previous = current?.[current.length - 1]
    if (
      previous &&
      Date.parse(analysis.run.createdAt) - Date.parse(previous.run.createdAt) <=
        thresholds.clusterGapMs
    ) {
      current.push(analysis)
    } else {
      clusters.push([analysis])
    }
  }

  return clusters
    .map((runs) => ({
      branches: [...new Set(runs.map((analysis) => analysis.run.branch))],
      end: runs[runs.length - 1].run.createdAt,
      runs,
      start: runs[0].run.createdAt,
    }))
    .filter(
      (cluster) =>
        cluster.runs.length >= thresholds.clusterMinRuns &&
        cluster.branches.length >= thresholds.clusterMinBranches,
    )
}
