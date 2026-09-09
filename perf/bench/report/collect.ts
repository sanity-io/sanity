import {execFileSync} from 'node:child_process'
import os from 'node:os'
import process from 'node:process'

import {type AbScenarioResult} from '../runner/orchestrator'
import {type InpSessionResult} from '../runner/session/inp'
import {type InteractionSessionResult} from '../runner/session/interaction'
import {type LoadCondition, type PageLoadSample} from '../runner/session/pageLoad'
import {type SettleSessionResult} from '../runner/session/settle'
import {type BenchScenario} from '../scenarios/types'
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

const TRIGGERS = new Set(['cron', 'release', 'backfill', 'dispatch', 'pr'])

/**
 * Why this run happened, and (for release runs) which tag it measured.
 *
 * `BENCH_TRIGGER` is set by the workflow, but it is not trusted blindly: an
 * unrecognized value falls back to inference rather than being stored, so a typo
 * in a workflow edit cannot invent a trigger kind that consumers then filter on.
 * Inference covers every path that does not set it — notably the daily schedule,
 * which predates this field and must keep producing `cron`.
 *
 * `releaseTag` is only kept for `release` runs: a tag on a cron run would claim
 * that run measured a release, which is exactly the false attribution this
 * field exists to eliminate.
 */
function triggerFields(
  prNumber: number,
  mode: 'ab' | 'absolute',
): {
  trigger?: BenchRunDocument['trigger']
  releaseTag?: string
} {
  const declared = process.env.BENCH_TRIGGER
  const trigger: BenchRunDocument['trigger'] =
    declared && TRIGGERS.has(declared)
      ? (declared as BenchRunDocument['trigger'])
      : !Number.isNaN(prNumber)
        ? 'pr'
        : process.env.GITHUB_EVENT_NAME === 'schedule'
          ? 'cron'
          : // A dispatch measuring a historical commit is a backfill — but only
            // in absolute mode. An A/B dispatch also sets BENCH_GIT_SHA (to
            // ab_to), and calling that a backfill would misdescribe it: it
            // measures two commits against each other rather than repairing a
            // hole in the series.
            mode === 'absolute' && process.env.BENCH_GIT_SHA
            ? 'backfill'
            : 'dispatch'
  const releaseTag = process.env.BENCH_RELEASE_TAG
  return {
    trigger,
    ...(trigger === 'release' && releaseTag ? {releaseTag} : {}),
  }
}

export function collectRunMetadata(options: {
  mode: 'ab' | 'absolute'
  calibrationMs: number
  cpuThrottleRate: number
  seed: number
  startedAt: string
  /** Chromium version the sessions run in (`browser.version()`). */
  browserVersion?: string
}): Omit<BenchRunDocument, 'scenarios' | 'completedAt' | 'bundle'> {
  const prNumber = Number(
    (process.env.GITHUB_REF ?? '').match(/refs\/pull\/(\d+)\//)?.[1] ?? Number.NaN,
  )
  // Committer date of the measured commit — the time-series x-axis (dashboards
  // plot it instead of startedAt so backfilled points land on their commit's
  // date). Backfill shards check out HEAD, not the measured sha, so the
  // workflow resolves the date where full history exists (prepare-backfill)
  // and passes it through; everywhere else HEAD is the measured commit and
  // its committer date is resolvable even in a depth-1 clone.
  const committedAtRaw =
    process.env.BENCH_GIT_COMMITTED_AT || git(['show', '-s', '--format=%cI', 'HEAD'])
  // Omit anything unparseable — the git() helper answers 'unknown' outside a
  // repo, and a malformed workflow override must not poison the time axis
  // consumers sort and filter on
  const committedAt = Number.isNaN(Date.parse(committedAtRaw)) ? undefined : committedAtRaw
  const triggerInfo = triggerFields(prNumber, options.mode)

  return {
    _type: 'benchRun',
    schemaVersion: 1,
    mode: options.mode,
    ...triggerInfo,
    git: {
      // BENCH_GIT_SHA: the commit the measured dist was actually built from,
      // when that differs from the checkout — backfill runs build a
      // historical commit's packages with HEAD's harness (see
      // cli/commands/prepareBackfill.ts) and must be stored under that
      // commit, not the workflow's HEAD
      sha: process.env.BENCH_GIT_SHA || process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']),
      // A release run is dispatched at its tag, so GITHUB_REF_NAME is the tag
      // name ('v6.11.0'). The commit it measures is a main commit, and the
      // dashboards group runs into per-branch lines and default to main — a run
      // filed under a tag name would sit outside the main series it belongs to.
      // The ref names how the run was dispatched; the branch names where the
      // measured commit lives, which for a release is always main — and for a
      // backfill too: it replays a main-history commit, wherever the workflow
      // carrying the harness was dispatched from (a branch dispatch of a
      // backfill must not file main's history under that branch).
      //
      // GITHUB_HEAD_REF is empty (not unset) outside pull_request events, and
      // schedule runs are detached checkouts where rev-parse answers "HEAD" —
      // prefer GITHUB_REF_NAME there
      branch:
        (triggerInfo.trigger === 'release' || triggerInfo.trigger === 'backfill' ? 'main' : '') ||
        process.env.GITHUB_HEAD_REF ||
        process.env.GITHUB_REF_NAME ||
        git(['rev-parse', '--abbrev-ref', 'HEAD']),
      ...(committedAt ? {committedAt} : {}),
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
      // The hardware discriminator: GitHub rotates CPU generations under the
      // same vCPU shape, so cpus/memGb can't explain a host-speed step but
      // the model string can. Empty on platforms where Node reports none.
      ...(os.cpus()[0]?.model.trim() ? {cpuModel: os.cpus()[0].model.trim()} : {}),
      // GitHub runner image identity — pins when the image (toolchain, libs)
      // rolled, which tends to coincide with host-speed regime changes
      ...(process.env.ImageOS ? {imageOs: process.env.ImageOS} : {}),
      ...(process.env.ImageVersion ? {imageVersion: process.env.ImageVersion} : {}),
      // The measuring instrument: a Playwright bump moves INP/vitals with no
      // studio change, and this is what makes that visible after the fact
      ...(options.browserVersion ? {browserVersion: options.browserVersion} : {}),
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

/** Exact gzip sum of the chunks a sample fetched; null when none matched. */
function bootJsBytes(paths: string[], sizes: ReadonlyMap<string, number>): number | null {
  let total = 0
  let matched = 0
  for (const path of paths) {
    const size = sizes.get(path)
    if (size !== undefined) {
      total += size
      matched += 1
    }
  }
  return matched > 0 ? total : null
}

/**
 * pageLoad samples (both sides) → scenario report. `chunkGzipSizes` (dist
 * path → exact gzip bytes per side, from measureBundleSize) enables the
 * "boot JS" row: what booting actually downloads, as opposed to the entry
 * chunk the bundle report counts. Per side because chunk names are
 * content-hashed: valuing reference-side fetches against the experiment
 * build's sizes would produce a partial sum that reads as a fake A/B diff.
 */
export function collectPageLoad(
  scenario: string,
  samplesBySide: Map<string, PageLoadSample[]>,
  comparisons: Map<LoadCondition, {interval: DiffInterval; verdict: Verdict}>,
  sourceFile?: string,
  chunkGzipSizes?: {
    experiment: ReadonlyMap<string, number>
    reference?: ReadonlyMap<string, number>
  },
): ScenarioReport {
  const experiment = samplesBySide.get('experiment') ?? []
  const reference = samplesBySide.get('reference')

  /** Report-only row (never gated) from one value per sample. */
  const reportOnly = (
    condition: LoadCondition,
    label: string,
    unit: MetricReport['unit'],
    value: (sample: PageLoadSample, side: 'experiment' | 'reference') => number | null,
  ): MetricReport[] => {
    const values = (samples: PageLoadSample[] | undefined, side: 'experiment' | 'reference') =>
      (samples ?? [])
        .filter((sample) => sample.condition === condition)
        .map((sample) => value(sample, side))
        .filter((sampleValue): sampleValue is number => sampleValue !== null)
        .map((sampleValue) => [sampleValue])
    const experimentValues = values(experiment, 'experiment')
    if (experimentValues.length === 0) return []
    const referenceValues = values(reference, 'reference')
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
        // just time-to-editable. No TTFB: against the local mock it's a
        // constant of the bench setup, not a studio signal.
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
        // What booting actually downloads: exact gzip sum of the chunks this
        // sample fetched before editable. boot-cold only — the warm page
        // replays the same set from cache. (The bundle report's entry-chunk
        // number is only what index.html references.)
        ...(condition === 'boot-cold' && chunkGzipSizes
          ? reportOnly(condition, 'boot JS', 'bytes', (sample, side) => {
              // Each side's fetches valued against its own build's chunk
              // sizes; a side without a size map gets no value at all rather
              // than a misleading partial sum
              const sizes =
                side === 'reference' ? chunkGzipSizes.reference : chunkGzipSizes.experiment
              return sizes ? bootJsBytes(sample.jsPaths, sizes) : null
            })
          : []),
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

  // Which elements shifted, summed across experiment samples — the CLS
  // number's culprit list, same idea as the script blockers above
  const byShiftSource = new Map<string, {source: string; totalValue: number}>()
  for (const sample of experiment) {
    for (const shift of sample.clsAttribution) {
      const existing = byShiftSource.get(shift.source) ?? {source: shift.source, totalValue: 0}
      existing.totalValue += shift.totalValue
      byShiftSource.set(shift.source, existing)
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
    clsAttribution: [...byShiftSource.values()]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5),
  }
}

export function collectSettle(
  scenario: BenchScenario,
  sessions: SettleSessionResult[],
): ScenarioReport {
  const countMetric = (label: string, values: number[][]): MetricReport => ({
    label,
    unit: 'count',
    presentAsEfps: false,
    experiment: {sessions: values, summary: summarize(values.flat())},
  })
  const msMetric = (label: string, values: number[][]): MetricReport => ({
    label,
    unit: 'ms',
    presentAsEfps: false,
    experiment: {sessions: values, summary: summarize(values.flat())},
  })

  const settleTimes = sessions
    .map((session) => session.settleTimeMs)
    .filter((value): value is number => value !== null)
    .map((value) => [value])

  const metrics: MetricReport[] = [
    // Run-level count (one pseudo-session), because the trend needs it: a
    // median over per-session 0/1 values hides a single failing session
    // (median of [0,1,1,1] is 1). This series is 0-flat when healthy, jumps
    // on a regression, and charts as a constant N for red-by-design
    // scenarios — their standing-evidence line.
    countMetric('sessions not settled', [[sessions.filter((session) => !session.settled).length]]),
    // Same shape for the primary signal's health: sessions where the React
    // DevTools hook stub never attached (contract drift in react-dom). With
    // the counter dark, commits read as zero and a green scenario looks
    // healthier, not worse — this line is what says the detector went blind.
    countMetric('sessions without commit counter', [
      [sessions.filter((session) => !session.hookInstalled).length],
    ]),
    // 0/1 per session — the per-session record behind the count above.
    countMetric(
      'settled sessions',
      sessions.map((session) => [session.settled ? 1 : 0]),
    ),
    countMetric(
      'ready sessions',
      sessions.map((session) => [session.ready ? 1 : 0]),
    ),
    ...(settleTimes.length > 0 ? [msMetric('time to settle', settleTimes)] : []),
    countMetric(
      'react commits after ready',
      sessions.map((session) => [session.reactCommits]),
    ),
    msMetric(
      'LoAF blocking after ready',
      sessions.map((session) => [session.loafBlockingMs]),
    ),
    ...(() => {
      const cpuSessions = sessions
        .map((session) => session.cpuAfterReadyMs)
        .filter((value): value is number => value !== null)
        .map((value) => [value])
      return cpuSessions.length > 0 ? [msMetric('cpu after ready', cpuSessions)] : []
    })(),
    // One row per instrumented component, `renders · <name>` — the
    // per-component attribution the commit total can't give.
    ...[...new Set(sessions.flatMap((session) => Object.keys(session.renderMarks)))]
      .sort()
      .map((name) =>
        countMetric(
          `renders · ${name}`,
          sessions.map((session) => [session.renderMarks[name] ?? 0]),
        ),
      ),
  ]

  const byScript = new Map<string, {sourceUrl: string; functionName: string; totalMs: number}>()
  for (const session of sessions) {
    for (const entry of session.loafAttribution) {
      const key = `${entry.sourceUrl}#${entry.functionName}`
      const current = byScript.get(key)
      if (current) current.totalMs += entry.totalMs
      else byScript.set(key, {...entry})
    }
  }

  return {
    scenario: scenario.name,
    sourceFile: scenario.sourceFile,
    kind: 'pageload',
    // Distinct from the plain pageLoad report so the two don't collide on the
    // stored _key / shard-merge dedup (see ScenarioReport.mode)
    mode: 'settle',
    settleExpectation: {expectedToSettle: scenario.expectedToSettle ?? true},
    metrics,
    failures: [],
    interruptions: {experiment: {count: 0, totalMs: 0}},
    loafAttribution: [...byScript.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 5),
  }
}
