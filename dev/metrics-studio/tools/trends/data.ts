/**
 * Data layer for the Trends tool: one tightly-projected GROQ query (never
 * fetch `sessions` — see SPEC.md) and pure series derivation.
 */

export interface TrendRun {
  _id: string
  startedAt: string
  mode: 'ab' | 'absolute'
  git: {sha: string; branch: string; prNumber?: number; mergeBaseSha?: string} | null
  runner: {calibrationMs: number; runId?: string; runAttempt?: number} | null
  bundle: {experiment: {initialJsBytes: number} | null} | null
  scenarios:
    | {
        scenario: string
        sourceFile?: string
        /** Per-scenario shard runner calibration (multi-shard CI runs only). */
        runner?: {calibrationMs: number | null} | null
        kind: 'interaction' | 'pageload'
        metrics:
          | {
              label: string
              unit: 'ms' | 'count' | 'cls'
              experiment: {summary: {median: number; p75: number; p90: number} | null} | null
            }[]
          | null
        soak?: {
          minutes: number
          samples:
            | {
                minute: number
                heapMb: number
                domNodes: number
                listeners: number
                latencyP50Ms: number | null
                cpuTaskMs: number | null
                connections: number
                requests: number
              }[]
            | null
        } | null
      }[]
    | null
}

export const TREND_QUERY = `*[_type == "benchRun"] | order(startedAt asc) {
  _id,
  startedAt,
  mode,
  git{sha, branch, prNumber, mergeBaseSha},
  runner{calibrationMs, runId, runAttempt},
  bundle{experiment{initialJsBytes}},
  scenarios[]{
    scenario,
    sourceFile,
    runner{calibrationMs},
    kind,
    metrics[]{label, unit, experiment{summary{median, p75, p90}}},
    soak{minutes, samples[]{minute, heapMb, domNodes, listeners, latencyP50Ms, cpuTaskMs, connections, requests}}
  }
}`

export type TrendUnit =
  | 'ms'
  | 'count'
  | 'cls'
  | 'bytes'
  | 'megabytes'
  | 'mb-per-min'
  | 'count-per-min'
  | 'ms-per-min'

export interface TrendPoint {
  date: Date
  /** The plotted value (p50 for metrics). */
  value: number
  p75?: number
  p90?: number
  sha: string
  /** benchRun document id — opens the run in the studio. */
  runId: string
  /** Backlink metadata (GitHub PR / commit / CI run). */
  prNumber?: number
  ciRunId?: string
  ciRunAttempt?: number
}

/** One line within a chart — a single branch's run history for the metric. */
export interface TrendLine {
  branch: string
  points: TrendPoint[]
}

export interface TrendSeries {
  key: string
  title: string
  unit: TrendUnit
  /** One plain-English sentence: what this metric measures. */
  description: string
  /** How to read the trend: lower values are better, or context-only. */
  goal: 'lower' | 'context'
  /** Section the chart is grouped under in the dashboard. */
  group: TrendGroup
  /** Repo-root-relative scenario source file, for a "view source" backlink. */
  sourceFile?: string
  /**
   * What the x-axis represents. 'date' (default) plots run history over time;
   * 'minute' plots one run's samples over its elapsed minutes — the point
   * `date` field then encodes the minute (epoch + minute) so the time scale
   * works unchanged.
   */
  xKind?: 'date' | 'minute'
  /** One line per branch (usually just one — comparison overlays several). */
  lines: TrendLine[]
}

/** All git branches present in the runs, `main` first, then alphabetical. */
export function availableBranches(runs: TrendRun[]): string[] {
  const branches = new Set<string>()
  for (const run of runs) {
    if (run.git?.branch) branches.add(run.git.branch)
  }
  return [...branches].sort((a, b) => {
    if (a === 'main') return -1
    if (b === 'main') return 1
    return a.localeCompare(b)
  })
}

export type TrendGroup = 'vitals' | 'responsiveness' | 'load' | 'bundle' | 'soak' | 'environment'

/**
 * The soak sample fields we chart, with display metadata. A constant,
 * self-erasing workload means every one of these should stay flat over the
 * minutes of the run — any upward slope is a leak or degradation.
 */
export const SOAK_METRICS: {
  key:
    | 'heapMb'
    | 'domNodes'
    | 'listeners'
    | 'latencyP50Ms'
    | 'cpuTaskMs'
    | 'connections'
    | 'requests'
  title: string
  unit: TrendUnit
  description: string
}[] = [
  {
    key: 'heapMb',
    title: 'JS heap',
    unit: 'megabytes',
    description:
      'Post-GC heap size each minute. A rising slope under a constant workload is a memory leak.',
  },
  {
    key: 'domNodes',
    title: 'DOM nodes',
    unit: 'count',
    description:
      'Live DOM node count. Growth without new content means detached nodes are being retained.',
  },
  {
    key: 'listeners',
    title: 'Event listeners',
    unit: 'count',
    description:
      'Registered event listeners. A climb signals subscriptions that never get torn down.',
  },
  {
    key: 'latencyP50Ms',
    title: 'Keystroke latency',
    unit: 'ms',
    description:
      'Median keystroke latency that minute. Rising latency is degradation under sustained use.',
  },
  {
    key: 'cpuTaskMs',
    title: 'CPU task time',
    unit: 'ms',
    description:
      'Main-thread task time spent that minute. A trend up means the studio is doing more work over time.',
  },
  {
    key: 'connections',
    title: 'Listener connections',
    unit: 'count',
    description: 'Open realtime connections to the mock. Growth is a reconnect/resubscribe leak.',
  },
  {
    key: 'requests',
    title: 'Requests',
    unit: 'count',
    description:
      'Requests the studio made that minute. A rising rate is a polling or refetch loop.',
  },
]

export const TREND_GROUPS: {id: TrendGroup; title: string; description: string}[] = [
  {
    id: 'vitals',
    title: 'Web Vitals',
    description:
      'Google Core Web Vitals and supporting load metrics — LCP, INP, CLS, FCP, TTFB. The user-facing quality bar; lower is better on all of them.',
  },
  {
    id: 'responsiveness',
    title: 'Editing responsiveness',
    description: 'Per-keystroke latency (keydown → paint) while typing into each scenario.',
  },
  {
    id: 'load',
    title: 'Load',
    description: 'How long from opening a document until it is ready to edit, and what blocks it.',
  },
  {
    id: 'bundle',
    title: 'Bundle size',
    description: 'JavaScript shipped to boot the studio.',
  },
  {
    id: 'soak',
    title: 'Soak (endurance)',
    description:
      'One long session typing continuously into a self-erasing document. Every line should stay flat — an upward slope is a leak or degradation over time.',
  },
  {
    id: 'environment',
    title: 'Calibration',
    description:
      'CI host speed per run — honesty context for every other tab, since absolute numbers are host-relative.',
  },
]

/**
 * Plain-English description per metric so a first-time viewer can read the
 * dashboard without knowing the bench suite. Matched on the metric labels
 * emitted by perf/bench/report/collect.ts.
 */
function describeSeries(
  kind: 'interaction' | 'pageload',
  label: string,
): Pick<TrendSeries, 'description' | 'goal' | 'group'> {
  if (label.includes('time to editable')) {
    return {
      group: 'load',
      description: 'From navigation start until the document form accepts a keystroke.',
      goal: 'lower',
    }
  }
  if (label.includes('main-thread blocking')) {
    return {
      group: 'load',
      description:
        'How long the main thread was frozen during load (long animation frames) — the UI is unresponsive for this time.',
      goal: 'lower',
    }
  }
  if (label.endsWith('TTFB')) {
    return {
      group: 'vitals',
      description: 'Time to first byte of the document response.',
      goal: 'lower',
    }
  }
  if (label.endsWith('FCP')) {
    return {
      group: 'vitals',
      description: 'First Contentful Paint — first pixels drawn.',
      goal: 'lower',
    }
  }
  if (label.endsWith('LCP')) {
    return {
      group: 'vitals',
      description: 'Largest Contentful Paint — the main content is visible (Core Web Vital).',
      goal: 'lower',
    }
  }
  if (label.endsWith('CLS')) {
    return {
      group: 'vitals',
      description:
        'Cumulative Layout Shift — how much the layout jumps during load (Core Web Vital; lower is steadier).',
      goal: 'lower',
    }
  }
  if (label === 'INP interactions') {
    return {
      group: 'vitals',
      description:
        'How many distinct interactions the INP session observed — confidence context for the INP number (the percentile rule wants at least 50). Not a judged metric.',
      goal: 'context',
    }
  }
  if (label.endsWith('INP')) {
    return {
      group: 'vitals',
      description:
        'Interaction to Next Paint — a high percentile of interaction latencies (click/type → next paint) under a realistic interaction mix (Core Web Vital).',
      goal: 'lower',
    }
  }
  if (label.includes('auth round trips')) {
    return {
      group: 'load',
      description: 'Auth API round trips completed before the form was editable.',
      goal: 'lower',
    }
  }
  if (label.includes('auth first request')) {
    return {
      group: 'load',
      description:
        'How long after navigation the first auth request was issued — client-side work we control.',
      goal: 'lower',
    }
  }
  if (label.includes('auth in flight')) {
    return {
      group: 'load',
      description:
        'Time auth requests spent waiting on the API before the form was editable — scales with real-world API latency.',
      goal: 'lower',
    }
  }
  if (kind === 'interaction') {
    return {
      group: 'responsiveness',
      description: `Median keystroke latency (keydown → paint) while typing into “${label}”.`,
      goal: 'lower',
    }
  }
  return {group: 'load', description: label, goal: 'lower'}
}

export function formatValue(value: number, unit: TrendUnit): string {
  if (unit === 'count') return value.toFixed(0)
  if (unit === 'cls') return value.toFixed(3) // unitless layout-shift score
  if (unit === 'bytes') return `${(value / 1024).toFixed(1)} KB`
  if (unit === 'megabytes') return `${value.toFixed(1)} MB`
  // Slope units are signed and typically fractional — keep the sign and
  // enough precision that a near-zero rate reads as "~0", not a rounded 0
  if (unit === 'mb-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)} MB/min`
  if (unit === 'count-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)}/min`
  if (unit === 'ms-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)} ms/min`
  return `${value.toFixed(0)}ms`
}

/** Slope/rate units are signed and centered on zero (flat = good). */
export function isSignedUnit(unit: TrendUnit): boolean {
  return unit === 'mb-per-min' || unit === 'count-per-min' || unit === 'ms-per-min'
}

/** The per-minute slope unit for a soak metric's base unit. */
function slopeUnitFor(baseUnit: TrendUnit): TrendUnit {
  if (baseUnit === 'megabytes') return 'mb-per-min'
  if (baseUnit === 'ms') return 'ms-per-min'
  return 'count-per-min'
}

export function filterByRange(runs: TrendRun[], days: number | null): TrendRun[] {
  if (days === null) return runs
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return runs.filter((run) => new Date(run.startedAt).getTime() >= cutoff)
}

/**
 * One series per scenario·metric across all runs, plus the bundle size. Each
 * series holds one line per git branch present in the runs — a single branch
 * renders as one line, several overlay for comparison.
 */
/** Backlink + identity fields every TrendPoint carries, derived from a run. */
function pointMeta(
  run: TrendRun,
): Pick<TrendPoint, 'sha' | 'runId' | 'prNumber' | 'ciRunId' | 'ciRunAttempt'> {
  return {
    sha: run.git?.sha ?? 'unknown',
    runId: run._id,
    prNumber: run.git?.prNumber,
    ciRunId: run.runner?.runId,
    ciRunAttempt: run.runner?.runAttempt,
  }
}

export function buildSeries(runs: TrendRun[]): TrendSeries[] {
  const series = new Map<string, TrendSeries>()
  const push = (
    key: string,
    title: string,
    unit: TrendUnit,
    meta: Pick<TrendSeries, 'description' | 'goal' | 'group' | 'sourceFile'>,
    run: TrendRun,
    point: Pick<TrendPoint, 'value' | 'p75' | 'p90'>,
  ) => {
    const existing = series.get(key) ?? {key, title, unit, ...meta, lines: []}
    const branch = run.git?.branch ?? 'unknown'
    let line = existing.lines.find((candidate) => candidate.branch === branch)
    if (!line) {
      line = {branch, points: []}
      existing.lines.push(line)
    }
    line.points.push({date: new Date(run.startedAt), ...pointMeta(run), ...point})
    series.set(key, existing)
  }

  for (const run of runs) {
    for (const scenario of run.scenarios ?? []) {
      for (const metric of scenario.metrics ?? []) {
        const summary = metric.experiment?.summary
        if (!summary) continue
        push(
          `${scenario.kind}:${scenario.scenario}:${metric.label}`,
          `${scenario.scenario} · ${metric.label}`,
          metric.unit,
          {...describeSeries(scenario.kind, metric.label), sourceFile: scenario.sourceFile},
          run,
          {value: summary.median, p75: summary.p75, p90: summary.p90},
        )
      }
    }
    const initialJs = run.bundle?.experiment?.initialJsBytes
    if (typeof initialJs === 'number') {
      push(
        'bundle:initialJs',
        'bundle · initial JS (gzip)',
        'bytes',
        {
          group: 'bundle',
          description: 'Initial JavaScript downloaded to boot the studio, gzip-compressed.',
          goal: 'lower',
        },
        run,
        {value: initialJs},
      )
    }
  }
  return [...series.values()]
}

/** The honesty overlay: host-speed score per run (higher = slower host). */
export function calibrationSeries(runs: TrendRun[]): TrendSeries {
  // One line per branch, like the metric charts. Collecting every branch's
  // runs into a single line interleaves two host-speed curves into one path
  // (and stacks two dot trails on top of each other) — group by branch so
  // each is a clean, separately-coloured trail.
  const byBranch = new Map<string, TrendLine>()
  for (const run of runs) {
    // Multi-shard CI runs execute each scenario on a separate machine, so a
    // single document carries several host-speed scores (stamped per scenario
    // by mergeShards). Plot each distinct shard calibration as its own point —
    // the vertical spread at one date IS the cross-shard host variance. Older
    // documents (no per-scenario runner) fall back to the run-level score.
    const shardScores = new Set<number>()
    for (const scenario of run.scenarios ?? []) {
      if (typeof scenario.runner?.calibrationMs === 'number') {
        shardScores.add(scenario.runner.calibrationMs)
      }
    }
    const values =
      shardScores.size > 0 ? [...shardScores] : run.runner ? [run.runner.calibrationMs] : []
    if (values.length === 0) continue
    const branch = run.git?.branch ?? 'unknown'
    let line = byBranch.get(branch)
    if (!line) {
      line = {branch, points: []}
      byBranch.set(branch, line)
    }
    for (const value of values) {
      line.points.push({
        date: new Date(run.startedAt),
        value,
        ...pointMeta(run),
      })
    }
  }
  return {
    key: 'runner:calibration',
    title: 'host calibration (higher = slower host)',
    unit: 'ms',
    description:
      'A fixed CPU workload run on the CI machine before each benchmark. All numbers above are relative to host speed — when this line spikes where a metric spikes, suspect the runner, not the studio.',
    goal: 'context',
    group: 'environment',
    lines: [...byBranch.values()],
  }
}

type SoakScenario = NonNullable<NonNullable<TrendRun['scenarios']>[number]['soak']>
type SoakSample = NonNullable<SoakScenario['samples']>[number]

/** Find each run's soak scenario (there's at most one), newest run first. */
function runsWithSoak(
  runs: TrendRun[],
): {run: TrendRun; soak: SoakScenario; sourceFile?: string}[] {
  return runs
    .map((run) => {
      const scenario = run.scenarios?.find((s) => s.soak?.samples?.length)
      return scenario?.soak ? {run, soak: scenario.soak, sourceFile: scenario.sourceFile} : null
    })
    .filter(
      (entry): entry is {run: TrendRun; soak: SoakScenario; sourceFile?: string} => entry !== null,
    )
}

/**
 * In-run soak charts for the most recent run that has soak data: one chart
 * per SOAK_METRICS entry, x = elapsed minute. Empty when no run has soak.
 */
export function latestSoakCharts(runs: TrendRun[]): {run: TrendRun; charts: TrendSeries[]} | null {
  const withSoak = runsWithSoak(runs)
  const latest = withSoak.at(-1)
  if (!latest) return null
  const samples = (latest.soak.samples ?? []).toSorted((a, b) => a.minute - b.minute)

  const charts = SOAK_METRICS.map((metric): TrendSeries => {
    const points: TrendPoint[] = samples
      .map((sample) => ({sample, value: sample[metric.key]}))
      .filter(
        (entry): entry is {sample: SoakSample; value: number} => typeof entry.value === 'number',
      )
      .map(({sample, value}) => ({
        // Encode the minute as a Date so the time scale renders it unchanged
        date: new Date(sample.minute * 60_000),
        value,
        ...pointMeta(latest.run),
      }))
    return {
      key: `soak:latest:${metric.key}`,
      title: metric.title,
      unit: metric.unit,
      description: metric.description,
      goal: 'lower',
      group: 'soak',
      sourceFile: latest.sourceFile,
      xKind: 'minute',
      lines: [{branch: latest.run.git?.branch ?? 'unknown', points}],
    }
  }).filter((chart) => chart.lines[0].points.length > 0)

  return {run: latest.run, charts}
}

/** Least-squares slope (value change per minute) of a soak sample series. */
function slopePerMinute(samples: SoakSample[], key: keyof SoakSample): number {
  const pairs = samples
    .map((sample) => ({x: sample.minute, y: sample[key]}))
    .filter((pair): pair is {x: number; y: number} => typeof pair.y === 'number')
  if (pairs.length < 2) return 0
  const n = pairs.length
  const sumX = pairs.reduce((acc, p) => acc + p.x, 0)
  const sumY = pairs.reduce((acc, p) => acc + p.y, 0)
  const sumXY = pairs.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumXX = pairs.reduce((acc, p) => acc + p.x * p.x, 0)
  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return 0
  return (n * sumXY - sumX * sumY) / denominator
}

/** The end-of-run (last-minute) value of a soak metric, or null if absent. */
function lastSoakValue(samples: SoakSample[], key: keyof SoakSample): number | null {
  for (let i = samples.length - 1; i >= 0; i--) {
    const value = samples[i][key]
    if (typeof value === 'number') return value
  }
  return null
}

/**
 * Build a historical (one-dot-per-run) soak trend for every SOAK_METRIC, given
 * a per-run reducer. Used for both the slope view ("is the leak worsening
 * release over release?") and the end-of-run value view ("where did it land?").
 * One line per branch; empty series (no run had the metric) are dropped.
 */
function soakHistory(
  runs: TrendRun[],
  variant: 'slope' | 'latest',
  reduce: (samples: SoakSample[], key: keyof SoakSample) => number | null,
  meta: (
    metric: (typeof SOAK_METRICS)[number],
  ) => Pick<TrendSeries, 'title' | 'unit' | 'description'>,
): TrendSeries[] {
  const withSoak = runsWithSoak(runs)
  const byMetric = SOAK_METRICS.map((metric): TrendSeries => {
    const lineByBranch = new Map<string, TrendLine>()
    let sourceFile: string | undefined
    for (const {run, soak, sourceFile: file} of withSoak) {
      const value = reduce(soak.samples ?? [], metric.key)
      if (value === null) continue
      sourceFile ??= file
      const branch = run.git?.branch ?? 'unknown'
      const line = lineByBranch.get(branch) ?? {branch, points: []}
      line.points.push({date: new Date(run.startedAt), value, ...pointMeta(run)})
      lineByBranch.set(branch, line)
    }
    return {
      key: `soak:${variant}:${metric.key}`,
      goal: 'lower',
      group: 'soak',
      sourceFile,
      lines: [...lineByBranch.values()],
      ...meta(metric),
    }
  })
  return byMetric.filter((series) => series.lines.some((line) => line.points.length > 0))
}

/**
 * Slope-over-time trend for every soak metric: reduce each run's soak series to
 * a per-minute slope and plot it across runs. "Is the leak / degradation
 * getting worse release over release?" — a rising or non-zero slope is the
 * signal for any of them.
 */
export function soakSlopeSeries(runs: TrendRun[]): TrendSeries[] {
  return soakHistory(
    runs,
    'slope',
    (samples, key) => slopePerMinute(samples, key),
    (metric) => ({
      title: `soak · ${metric.title} per minute`,
      unit: slopeUnitFor(metric.unit),
      description: `${metric.title} change per soak minute (linear fit), per run. Flat (~0) is healthy; a rising slope across runs is a worsening leak or degradation.`,
    }),
  )
}

/**
 * End-of-run value for every soak metric, across runs — a more literal history
 * than the slope: "where did each metric land by the end of the soak, release
 * over release?" Complements the slope view (a flat slope can still drift up in
 * absolute terms run to run).
 */
export function soakLatestValueSeries(runs: TrendRun[]): TrendSeries[] {
  return soakHistory(
    runs,
    'latest',
    (samples, key) => lastSoakValue(samples, key),
    (metric) => ({
      title: `soak · ${metric.title} at end`,
      unit: metric.unit,
      description: `${metric.title} at the end of the soak run, tracked across runs. ${metric.description}`,
    }),
  )
}
