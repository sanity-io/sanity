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
  points: TrendPoint[]
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
    run: TrendRun,
    point: Omit<TrendPoint, 'date' | 'sha' | 'runId'>,
  ) => {
    const existing = series.get(key) ?? {key, title, unit, points: []}
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
          run,
          {value: summary.median, p75: summary.p75, p90: summary.p90},
        )
      }
    }
    const initialJs = run.bundle?.experiment?.initialJsBytes
    if (typeof initialJs === 'number') {
      push('bundle:initialJs', 'bundle · initial JS (gzip)', 'bytes', run, {value: initialJs})
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
