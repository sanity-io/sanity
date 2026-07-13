/**
 * Drift detection: "did any metric move enough to care?" Two baselines, both
 * reported when they disagree (SPEC.md):
 *
 * - **trailing** — median of the last 7 runs vs the median of the prior 21.
 *   Catches slow drift that no single-run comparison would show.
 * - **step** — the latest run vs the median of the same weekday's last 4 runs.
 *   Catches sudden jumps, robust to day-of-week runner variance.
 *
 * "Enough to care" reuses the bench gate's thresholds (perf/bench/stats/
 * gate.ts) so the dashboard and the PR gate share one definition of a
 * meaningful change: the delta must clear BOTH an absolute floor and a
 * relative fraction of the baseline.
 */
import {type TrendPoint, type TrendSeries, type TrendUnit} from './data'

interface DriftThreshold {
  absolute: number
  relative: number
}

/** Mirrors INTERACTION_THRESHOLDS / PAGELOAD_THRESHOLDS by unit. */
function thresholdFor(unit: TrendUnit): DriftThreshold {
  // ms metrics split into keystroke-latency (tight) vs load (loose); we can't
  // tell them apart by unit alone, so use the stricter interaction floor for
  // ms — a load metric that clears 8% will clear it comfortably anyway.
  if (unit === 'ms') return {absolute: 3, relative: 0.05}
  if (unit === 'megabytes') return {absolute: 1, relative: 0.05}
  if (unit === 'bytes') return {absolute: 10 * 1024, relative: 0.05}
  // count (auth trips, listeners, …): any whole-unit move ≥5%
  return {absolute: 1, relative: 0.05}
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export type DriftDirection = 'regression' | 'improvement' | 'neutral'

export interface DriftBaseline {
  /** 'trailing' (slow drift) or 'step' (sudden jump). */
  kind: 'trailing' | 'step'
  recent: number
  baseline: number
  delta: number
  deltaFraction: number
  direction: DriftDirection
}

export interface DriftResult {
  seriesKey: string
  title: string
  unit: TrendUnit
  branch: string
  /** Only the baselines that fired (cleared the thresholds). */
  fired: DriftBaseline[]
  /** Worst direction across fired baselines, for sorting/coloring. */
  direction: DriftDirection
  /** The most recent run in this line — for backlinks to the likely culprit. */
  latest: Pick<TrendPoint, 'runId' | 'sha' | 'prNumber' | 'ciRunId' | 'ciRunAttempt'>
}

function classify(
  recent: number,
  baseline: number,
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftDirection {
  const delta = recent - baseline
  const cleared =
    Math.abs(delta) >= threshold.absolute &&
    baseline !== 0 &&
    Math.abs(delta) / Math.abs(baseline) >= threshold.relative
  if (!cleared || goal === 'context') return 'neutral'
  // Lower is better: a rise is a regression
  return delta > 0 ? 'regression' : 'improvement'
}

function makeBaseline(
  kind: DriftBaseline['kind'],
  recent: number,
  baselineValue: number,
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftBaseline | null {
  const direction = classify(recent, baselineValue, threshold, goal)
  if (direction === 'neutral') return null
  return {
    kind,
    recent,
    baseline: baselineValue,
    delta: recent - baselineValue,
    deltaFraction: baselineValue === 0 ? 0 : (recent - baselineValue) / Math.abs(baselineValue),
    direction,
  }
}

/** Points sorted oldest→newest, most recent last. */
function trailingBaseline(
  points: TrendPoint[],
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftBaseline | null {
  if (points.length < 10) return null // need a meaningful prior window
  const values = points.map((point) => point.value)
  const recent = median(values.slice(-7))
  const prior = median(values.slice(-28, -7))
  if (recent === null || prior === null) return null
  return makeBaseline('trailing', recent, prior, threshold, goal)
}

function stepBaseline(
  points: TrendPoint[],
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftBaseline | null {
  const latest = points.at(-1)
  if (!latest) return null
  const weekday = latest.date.getUTCDay()
  const sameWeekday = points
    .slice(0, -1)
    .filter((point) => point.date.getUTCDay() === weekday)
    .slice(-4)
  if (sameWeekday.length < 2) return null
  const priorMedian = median(sameWeekday.map((point) => point.value))
  if (priorMedian === null) return null
  return makeBaseline('step', latest.value, priorMedian, threshold, goal)
}

/** Flag every series whose recent runs drifted past the gate thresholds. */
export function computeDrift(seriesList: TrendSeries[]): DriftResult[] {
  const results: DriftResult[] = []
  for (const series of seriesList) {
    if (series.goal === 'context') continue
    const threshold = thresholdFor(series.unit)
    for (const line of series.lines) {
      const points = [...line.points].sort((a, b) => a.date.getTime() - b.date.getTime())
      const fired = [
        trailingBaseline(points, threshold, series.goal),
        stepBaseline(points, threshold, series.goal),
      ].filter((entry): entry is DriftBaseline => entry !== null)
      if (fired.length === 0) continue
      const direction: DriftDirection = fired.some((entry) => entry.direction === 'regression')
        ? 'regression'
        : 'improvement'
      const newest = points.at(-1)!
      results.push({
        seriesKey: series.key,
        title: series.title,
        unit: series.unit,
        branch: line.branch,
        fired,
        direction,
        latest: {
          runId: newest.runId,
          sha: newest.sha,
          prNumber: newest.prNumber,
          ciRunId: newest.ciRunId,
          ciRunAttempt: newest.ciRunAttempt,
        },
      })
    }
  }
  // Regressions first, then by largest relative move
  return results.sort((a, b) => {
    if (a.direction !== b.direction) return a.direction === 'regression' ? -1 : 1
    const aMax = Math.max(...a.fired.map((f) => Math.abs(f.deltaFraction)))
    const bMax = Math.max(...b.fired.map((f) => Math.abs(f.deltaFraction)))
    return bMax - aMax
  })
}
