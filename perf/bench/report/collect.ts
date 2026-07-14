import {execFileSync} from 'node:child_process'
import os from 'node:os'
import process from 'node:process'

import {type AbScenarioResult} from '../runner/orchestrator'
import {type InpSessionResult} from '../runner/session/inp'
import {type InteractionSessionResult} from '../runner/session/interaction'
import {type LoadCondition, type PageLoadSample} from '../runner/session/pageLoad'
import {type DiffInterval} from '../stats/bootstrap'
import {type Verdict} from '../stats/gate'
import {median, summarize} from '../stats/quantiles'
import {
  type BenchRunDocument,
  type MetricReport,
  type ResourceSide,
  type ScenarioReport,
} from './types'

function git(args: string[]): string {
  try {
    return execFileSync('git', args, {encoding: 'utf8'}).trim()
  } catch {
    return 'unknown'
  }
}

export function collectRunMetadata(options: {
  mode: 'ab' | 'absolute'
  calibrationMs: number
  cpuThrottleRate: number
  seed: number
  startedAt: string
}): Omit<BenchRunDocument, 'scenarios' | 'completedAt' | 'bundle'> {
  const prNumber = Number(
    (process.env.GITHUB_REF ?? '').match(/refs\/pull\/(\d+)\//)?.[1] ?? Number.NaN,
  )
  return {
    _type: 'benchRun',
    schemaVersion: 1,
    mode: options.mode,
    git: {
      sha: process.env.GITHUB_SHA ?? git(['rev-parse', 'HEAD']),
      // GITHUB_HEAD_REF is empty (not unset) outside pull_request events, and
      // schedule runs are detached checkouts where rev-parse answers "HEAD" —
      // prefer GITHUB_REF_NAME there
      branch:
        process.env.GITHUB_HEAD_REF ||
        process.env.GITHUB_REF_NAME ||
        git(['rev-parse', '--abbrev-ref', 'HEAD']),
      // The sha the reference side was built at (bench.yml passes the
      // prepare-reference output through) — rendered in the report footer
      ...(process.env.BENCH_MERGE_BASE ? {mergeBaseSha: process.env.BENCH_MERGE_BASE} : {}),
      ...(Number.isNaN(prNumber) ? {} : {prNumber}),
    },
    startedAt: options.startedAt,
    runner: {
      os: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      memGb: Math.round(os.totalmem() / 1024 ** 3),
      nodeVersion: process.version,
      ci: process.env.CI === 'true',
      ...(process.env.GITHUB_RUN_ID ? {runId: process.env.GITHUB_RUN_ID} : {}),
      ...(process.env.GITHUB_RUN_ATTEMPT
        ? {runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT)}
        : {}),
      calibrationMs: options.calibrationMs,
    },
    config: {cpuThrottleRate: options.cpuThrottleRate, seed: options.seed},
  }
}

function sumInterruptions(sessions: InteractionSessionResult[]): {count: number; totalMs: number} {
  return sessions.reduce(
    (acc, session) => ({
      count: acc.count + session.readOnlyInterruptions.count,
      totalMs: acc.totalMs + session.readOnlyInterruptions.totalMs,
    }),
    {count: 0, totalMs: 0},
  )
}

function topAttribution(sessions: InteractionSessionResult[]): ScenarioReport['loafAttribution'] {
  const byScript = new Map<string, {sourceUrl: string; functionName: string; totalMs: number}>()
  for (const session of sessions) {
    for (const script of session.loafAttribution) {
      const key = `${script.sourceUrl}#${script.functionName}`
      const existing = byScript.get(key) ?? {...script, totalMs: 0}
      existing.totalMs += script.totalMs
      byScript.set(key, existing)
    }
  }
  return [...byScript.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 5)
}

function fieldSessions(sessions: InteractionSessionResult[], label: string): number[][] {
  return sessions.map(
    (session) => session.fields.find((field) => field.label === label)?.samples ?? [],
  )
}

/** Per-session medians of the resources bucket (report-only). */
function collectResourceSide(sessions: InteractionSessionResult[]): ResourceSide | undefined {
  if (sessions.length === 0) return undefined
  const medianOf = (values: number[]) => (values.length > 0 ? median(values) : undefined)
  const classNames = new Set(sessions.flatMap((session) => Object.keys(session.requests.byClass)))
  const byClass: Record<string, number> = {}
  for (const className of classNames) {
    byClass[className] = median(
      sessions.map((session) => session.requests.byClass[className]?.count ?? 0),
    )
  }
  const cpuSessions = sessions.filter((session) => session.cpu !== null)
  const memorySessions = sessions.filter((session) => session.memory !== null)
  return {
    requestCount: median(sessions.map((session) => session.requests.total)),
    requestBytes: median(
      sessions.map((session) =>
        Object.values(session.requests.byClass).reduce(
          (sum, bucket) => sum + bucket.bytesIn + bucket.bytesOut,
          0,
        ),
      ),
    ),
    byClass,
    cpuTaskMs: medianOf(cpuSessions.map((session) => session.cpu!.taskMs)),
    cpuScriptMs: medianOf(cpuSessions.map((session) => session.cpu!.scriptMs)),
    heapMb: medianOf(memorySessions.map((session) => session.memory!.heapMb)),
    domNodes: medianOf(memorySessions.map((session) => session.memory!.domNodes)),
    listeners: medianOf(memorySessions.map((session) => session.memory!.listeners)),
  }
}

/** Interaction A/B result → scenario report. */
export function collectAbInteraction(
  result: AbScenarioResult,
  sourceFile?: string,
): ScenarioReport {
  return {
    scenario: result.scenario,
    ...(sourceFile ? {sourceFile} : {}),
    kind: 'interaction',
    metrics: result.comparisons.map((comparison): MetricReport => {
      const experimentSessions = fieldSessions(result.experiment.sessions, comparison.label)
      const referenceSessions = fieldSessions(result.reference.sessions, comparison.label)
      return {
        label: comparison.label,
        unit: 'ms',
        presentAsEfps: true,
        experiment: {
          sessions: experimentSessions,
          summary: summarize(experimentSessions.flat()),
        },
        reference: {
          sessions: referenceSessions,
          summary: summarize(referenceSessions.flat()),
        },
        comparison: {
          diff: comparison.interval.diff,
          lo: comparison.interval.lo,
          hi: comparison.interval.hi,
          verdict: comparison.verdict,
        },
      }
    }),
    stoppedBy: result.stoppedBy,
    failures: result.failures.map((failure) => ({side: failure.side, reason: failure.reason})),
    interruptions: {
      experiment: sumInterruptions(result.experiment.sessions),
      reference: sumInterruptions(result.reference.sessions),
    },
    loafAttribution: topAttribution(result.experiment.sessions),
    ...(collectResourceSide(result.experiment.sessions)
      ? {
          resources: {
            experiment: collectResourceSide(result.experiment.sessions)!,
            ...(collectResourceSide(result.reference.sessions)
              ? {reference: collectResourceSide(result.reference.sessions)!}
              : {}),
          },
        }
      : {}),
  }
}

/** Absolute-mode interaction sessions → scenario report (no comparisons). */
export function collectAbsoluteInteraction(
  scenario: string,
  sessions: InteractionSessionResult[],
  sourceFile?: string,
): ScenarioReport {
  const labels = sessions[0]?.fields.map((field) => field.label) ?? []
  return {
    scenario,
    ...(sourceFile ? {sourceFile} : {}),
    kind: 'interaction',
    metrics: labels.map((label): MetricReport => {
      const sessionSamples = fieldSessions(sessions, label)
      return {
        label,
        unit: 'ms',
        presentAsEfps: true,
        experiment: {sessions: sessionSamples, summary: summarize(sessionSamples.flat())},
      }
    }),
    failures: [],
    interruptions: {experiment: sumInterruptions(sessions)},
    loafAttribution: topAttribution(sessions),
    ...(collectResourceSide(sessions)
      ? {resources: {experiment: collectResourceSide(sessions)!}}
      : {}),
  }
}

/**
 * INP sessions → scenario report. INP is a Core Web Vital, reported (not
 * gated) during burn-in like the other vitals; each session contributes one
 * INP value. Filed under `pageload` kind so the dashboard groups it with the
 * load vitals (see the dashboard's describeSeries), and the interaction-count
 * row travels alongside so a low-confidence INP (few interactions) is visible.
 */
export function collectInp(
  scenario: string,
  sessions: InpSessionResult[],
  sourceFile?: string,
): ScenarioReport {
  const inpValues = sessions.map((session) => [session.inpMs])
  const interactionCounts = sessions.map((session) => [session.interactionCount])
  const metrics: MetricReport[] = [
    {
      label: 'INP',
      unit: 'ms',
      presentAsEfps: false,
      experiment: {sessions: inpValues, summary: summarize(inpValues.flat())},
    },
    {
      label: 'INP interactions',
      unit: 'count',
      presentAsEfps: false,
      experiment: {
        sessions: interactionCounts,
        summary: summarize(interactionCounts.flat()),
      },
    },
  ]
  return {
    scenario,
    ...(sourceFile ? {sourceFile} : {}),
    kind: 'pageload',
    // Distinct from the plain pageLoad report so the two don't collide on the
    // stored _key / shard-merge dedup (see ScenarioReport.mode)
    mode: 'inp',
    metrics,
    failures: [],
    interruptions: {
      experiment: sessions.reduce(
        (acc, session) => ({
          count: acc.count + session.readOnlyInterruptions.count,
          totalMs: acc.totalMs + session.readOnlyInterruptions.totalMs,
        }),
        {count: 0, totalMs: 0},
      ),
    },
    loafAttribution: [],
  }
}

/** pageLoad samples (both sides) → scenario report. */
export function collectPageLoad(
  scenario: string,
  samplesBySide: Map<string, PageLoadSample[]>,
  comparisons: Map<LoadCondition, {interval: DiffInterval; verdict: Verdict}>,
  sourceFile?: string,
): ScenarioReport {
  const experiment = samplesBySide.get('experiment') ?? []
  const reference = samplesBySide.get('reference')

  /** Report-only row (never gated) from one value per sample. */
  const reportOnly = (
    condition: LoadCondition,
    label: string,
    unit: MetricReport['unit'],
    value: (sample: PageLoadSample) => number | null,
  ): MetricReport[] => {
    const values = (samples: PageLoadSample[] | undefined) =>
      (samples ?? [])
        .filter((sample) => sample.condition === condition)
        .map(value)
        .filter((sampleValue): sampleValue is number => sampleValue !== null)
        .map((sampleValue) => [sampleValue])
    const experimentValues = values(experiment)
    if (experimentValues.length === 0) return []
    const referenceValues = values(reference)
    return [
      {
        label: `${condition} · ${label}`,
        unit,
        presentAsEfps: false,
        experiment: {sessions: experimentValues, summary: summarize(experimentValues.flat())},
        ...(referenceValues.length > 0
          ? {reference: {sessions: referenceValues, summary: summarize(referenceValues.flat())}}
          : {}),
      },
    ]
  }

  const metrics = (['boot-cold', 'open-doc-warm'] as LoadCondition[]).flatMap(
    (condition): MetricReport[] => {
      const experimentValues = experiment
        .filter((sample) => sample.condition === condition)
        .map((sample) => [sample.timeToEditableMs])
      if (experimentValues.length === 0) return []
      const referenceValues = reference
        ?.filter((sample) => sample.condition === condition)
        .map((sample) => [sample.timeToEditableMs])
      const comparison = comparisons.get(condition)
      return [
        {
          label: `${condition} · time to editable`,
          unit: 'ms',
          presentAsEfps: false,
          experiment: {
            sessions: experimentValues,
            summary: summarize(experimentValues.flat()),
          },
          ...(referenceValues && referenceValues.length > 0
            ? {
                reference: {
                  sessions: referenceValues,
                  summary: summarize(referenceValues.flat()),
                },
              }
            : {}),
          ...(comparison
            ? {
                comparison: {
                  diff: comparison.interval.diff,
                  lo: comparison.interval.lo,
                  hi: comparison.interval.hi,
                  verdict: comparison.verdict,
                },
              }
            : {}),
        },
        // Core Web Vitals (report-only) — captured per sample but previously
        // only logged; surface them so the dashboard tracks load quality, not
        // just time-to-editable
        ...reportOnly(condition, 'TTFB', 'ms', (sample) => sample.ttfbMs),
        ...reportOnly(condition, 'FCP', 'ms', (sample) => sample.fcpMs),
        ...reportOnly(condition, 'LCP', 'ms', (sample) => sample.lcpMs),
        ...reportOnly(condition, 'CLS', 'cls', (sample) => sample.cls),
        // Main-thread blocking during load (report-only) — for heavy
        // documents this IS the time-to-editable story; the per-script
        // breakdown lands in the scenario's loafAttribution
        ...reportOnly(condition, 'main-thread blocking', 'ms', (sample) => sample.blockingMs),
        // Auth boot-path milestones (see PageLoadSample.auth) — report-only:
        // the trip count is the actionable signal (a removed server round
        // trip shows as an exact -1), the in-flight window is the share that
        // scales with real-world API latency
        ...reportOnly(condition, 'auth round trips', 'count', (sample) => sample.auth.trips),
        ...reportOnly(
          condition,
          'auth first request',
          'ms',
          (sample) => sample.auth.firstRequestMs,
        ),
        ...reportOnly(condition, 'auth in flight', 'ms', (sample) => sample.auth.inFlightMs),
      ]
    },
  )

  // Top blockers across all experiment-side samples (both conditions) —
  // same shape and slot the interaction sessions use, so the PR comment's
  // "Top main-thread blockers" table and the stored document get it for free
  const byScript = new Map<string, {sourceUrl: string; functionName: string; totalMs: number}>()
  for (const sample of experiment) {
    for (const script of sample.loafAttribution) {
      const key = `${script.sourceUrl}#${script.functionName}`
      const existing = byScript.get(key) ?? {...script, totalMs: 0}
      existing.totalMs += script.totalMs
      byScript.set(key, existing)
    }
  }

  return {
    scenario,
    ...(sourceFile ? {sourceFile} : {}),
    kind: 'pageload',
    metrics,
    failures: [],
    interruptions: {experiment: {count: 0, totalMs: 0}},
    loafAttribution: [...byScript.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 5),
  }
}
