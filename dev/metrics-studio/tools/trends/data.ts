/**
 * Data layer for the Trends tool: one tightly-projected GROQ query (never
 * fetch `sessions` — see SPEC.md) and pure series derivation.
 */

export interface TrendRun {
  _id: string
  startedAt: string
  mode: 'ab' | 'absolute'
  git: {sha: string; branch: string} | null
  runner: {calibrationMs: number} | null
  bundle: {experiment: {initialJsBytes: number} | null} | null
  scenarios:
    | {
        scenario: string
        kind: 'interaction' | 'pageload'
        metrics:
          | {
              label: string
              unit: 'ms' | 'count'
              experiment: {summary: {median: number; p75: number; p90: number} | null} | null
            }[]
          | null
      }[]
    | null
}

export const TREND_QUERY = `*[_type == "benchRun"] | order(startedAt asc) {
  _id,
  startedAt,
  mode,
  git{sha, branch},
  runner{calibrationMs},
  bundle{experiment{initialJsBytes}},
  scenarios[]{
    scenario,
    kind,
    metrics[]{label, unit, experiment{summary{median, p75, p90}}}
  }
}`

export type TrendUnit = 'ms' | 'count' | 'bytes'

export interface TrendPoint {
  date: Date
  /** The plotted value (p50 for metrics). */
  value: number
  p75?: number
  p90?: number
  sha: string
  runId: string
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
  points: TrendPoint[]
}

export type TrendGroup = 'responsiveness' | 'load' | 'bundle' | 'environment'

export const TREND_GROUPS: {id: TrendGroup; title: string; description: string}[] = [
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
    id: 'environment',
    title: 'Environment',
    description: 'CI host speed — context for reading every metric above.',
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
  if (unit === 'bytes') return `${(value / 1024).toFixed(1)} KB`
  return `${value.toFixed(0)}ms`
}

export function filterByRange(runs: TrendRun[], days: number | null): TrendRun[] {
  if (days === null) return runs
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return runs.filter((run) => new Date(run.startedAt).getTime() >= cutoff)
}

/** One series per scenario·metric across all runs, plus the bundle size. */
export function buildSeries(runs: TrendRun[]): TrendSeries[] {
  const series = new Map<string, TrendSeries>()
  const push = (
    key: string,
    title: string,
    unit: TrendUnit,
    meta: Pick<TrendSeries, 'description' | 'goal'>,
    run: TrendRun,
    point: Omit<TrendPoint, 'date' | 'sha' | 'runId'>,
  ) => {
    const existing = series.get(key) ?? {key, title, unit, ...meta, points: []}
    existing.points.push({
      date: new Date(run.startedAt),
      sha: run.git?.sha ?? 'unknown',
      runId: run._id,
      ...point,
    })
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
          describeSeries(scenario.kind, metric.label),
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
  return {
    key: 'runner:calibration',
    title: 'host calibration (higher = slower host)',
    unit: 'ms',
    description:
      'A fixed CPU workload run on the CI machine before each benchmark. All numbers above are relative to host speed — when this line spikes where a metric spikes, suspect the runner, not the studio.',
    goal: 'context',
    group: 'environment',
    points: runs
      .filter((run) => run.runner)
      .map((run) => ({
        date: new Date(run.startedAt),
        value: run.runner!.calibrationMs,
        sha: run.git?.sha ?? 'unknown',
        runId: run._id,
      })),
  }
}
