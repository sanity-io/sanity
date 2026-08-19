/**
 * Drift detection: "did any metric move enough to care?"
 *
 * One baseline: the median of the last 7 runs against the median of the 21
 * before them. Smoothing both sides is what makes it trustworthy — a single
 * noisy run barely moves a median of 7, so a flag means a sustained shift.
 *
 * Windows are counted in **runs, not days**: the cron aims for one run a day but
 * the history has gaps and same-day doubles, so a day-based label would be a
 * guess. `buildSeries` has already merged re-runs of the same commit into one
 * point (see `mergeRunsPerCommit`), so a window of 21 is 21 commits — and the
 * spans the chart overlay draws line up with the plotted points exactly.
 *
 * A second, faster "step" baseline (latest run vs a median of recent runs, to
 * catch a jump the day it lands) was considered and rejected: measured against
 * the stored history it would fire on 74–92% of runs at every window size,
 * because run-to-run noise on these metrics (~12% median) is well over the 5%
 * threshold. A detector that fires four runs out of five is not a signal, and
 * no windowing fixes it. Detecting a single-run jump needs a more precise
 * measurement (more sessions per run), not different arithmetic.
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
  // CLS is unitless and small (good ≤ 0.1) — a whole-unit absolute floor would
  // mean CLS drift could never fire; 0.02 mirrors the scale web.dev uses
  if (unit === 'cls') return {absolute: 0.02, relative: 0.05}
  // count (auth trips, listeners, …): any whole-unit move ≥5%
  return {absolute: 1, relative: 0.05}
}

/** Window sizes, in runs — one point per commit, merged in `buildSeries`. */
const RECENT_RUNS = 7
const BASELINE_RUNS = 21

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export type DriftDirection = 'regression' | 'improvement' | 'neutral'

export interface DriftBaseline {
  recent: number
  baseline: number
  delta: number
  deltaFraction: number
  direction: DriftDirection
  /**
   * Run timestamps of the window whose median is `recent`, and of the window
   * whose median is `baseline` — what the chart overlay draws so the badge's
   * percentage can be checked against the runs that produced it. Timestamps
   * (not points) keep this small and serializable; the chart only needs the
   * x-positions. Sorted oldest→newest.
   */
  recentPointsMs: number[]
  baselinePointsMs: number[]
}

/**
 * How a baseline is described in the UI. Lives here rather than in a component
 * so the drift feed, the chart legend and the aria-labels can't describe it
 * differently — and counts the *actual* windows rather than quoting the target
 * sizes: with just enough history (10 runs) the prior window holds only 3 runs,
 * and "vs prior 21 runs" would overstate the evidence sevenfold.
 */
export function baselineLabel(baseline: DriftBaseline): string {
  return `vs prior ${baseline.baselinePointsMs.length} runs`
}

export function baselineDetail(baseline: DriftBaseline): string {
  return `median of the last ${baseline.recentPointsMs.length} runs vs the prior ${baseline.baselinePointsMs.length}`
}

export interface DriftResult {
  seriesKey: string
  title: string
  unit: TrendUnit
  branch: string
  /** The move that cleared the thresholds. */
  baseline: DriftBaseline
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
  recentPoints: TrendPoint[],
  baselinePoints: TrendPoint[],
  recent: number,
  baselineValue: number,
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftBaseline {
  // A sub-threshold move is still a real comparison worth drawing — the charts
  // show the overlay on every series, and `direction: 'neutral'` is what keeps
  // it out of the review feed and the tab counts.
  const direction = classify(recent, baselineValue, threshold, goal)
  return {
    recent,
    baseline: baselineValue,
    delta: recent - baselineValue,
    deltaFraction: baselineValue === 0 ? 0 : (recent - baselineValue) / Math.abs(baselineValue),
    direction,
    recentPointsMs: recentPoints.map((point) => point.date.getTime()),
    baselinePointsMs: baselinePoints.map((point) => point.date.getTime()),
  }
}

/** Points sorted oldest→newest, most recent last. */
function computeBaseline(
  points: TrendPoint[],
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftBaseline | null {
  // null here means "not enough history to compare", never "nothing moved" —
  // a computed-but-quiet comparison comes back as direction: 'neutral' instead
  if (points.length < 10) return null // need a meaningful prior window
  // Slice the points (not the values) so the same windows that produce the
  // medians also carry their timestamps to the chart overlay
  const recentPoints = points.slice(-RECENT_RUNS)
  const priorPoints = points.slice(-(RECENT_RUNS + BASELINE_RUNS), -RECENT_RUNS)
  const recent = median(recentPoints.map((point) => point.value))
  const prior = median(priorPoints.map((point) => point.value))
  if (recent === null || prior === null) return null
  return makeBaseline(recentPoints, priorPoints, recent, prior, threshold, goal)
}

/**
 * Reduce results to one per series, for flagging the chart card itself.
 *
 * Ranked by how much a human needs to look: a regression always beats an
 * improvement (a green badge must never mask a live regression on another
 * branch), and anything flagged beats a neutral comparison. Within one rank the
 * larger move wins. Explicit precedence matters now that neutral entries are in
 * the list — comparing only "same direction or not" let whichever arrived first
 * win between, say, a neutral and an improvement.
 */
const DIRECTION_RANK: Record<DriftDirection, number> = {
  regression: 2,
  improvement: 1,
  neutral: 0,
}

export function worstBySeries(entries: DriftResult[]): Map<string, DriftResult> {
  const map = new Map<string, DriftResult>()
  for (const entry of entries) {
    const current = map.get(entry.seriesKey)
    if (!current) {
      map.set(entry.seriesKey, entry)
      continue
    }
    const rank = DIRECTION_RANK[entry.direction] - DIRECTION_RANK[current.direction]
    const bigger = Math.abs(entry.baseline.deltaFraction) > Math.abs(current.baseline.deltaFraction)
    if (rank > 0 || (rank === 0 && bigger)) map.set(entry.seriesKey, entry)
  }
  return map
}

/**
 * A baseline comparison for every series with enough history — including the ones
 * that did not move enough to flag (`direction: 'neutral'`).
 *
 * The charts draw the overlay for all of them: "recent level vs prior level" is a
 * useful reference whether or not it crossed a threshold, and hiding it on quiet
 * charts made the overlay look like it came and went at random. Callers that mean
 * "needs review" must filter to regressions/improvements — `useDriftState` does,
 * so the feed and the tab badges only ever count real flags.
 */
export function computeDrift(seriesList: TrendSeries[]): DriftResult[] {
  const results: DriftResult[] = []
  for (const series of seriesList) {
    if (series.goal === 'context') continue
    const threshold = thresholdFor(series.unit)
    for (const line of series.lines) {
      const points = [...line.points].sort((a, b) => a.date.getTime() - b.date.getTime())
      const baseline = computeBaseline(points, threshold, series.goal)
      if (!baseline) continue
      const newest = points.at(-1)!
      results.push({
        seriesKey: series.key,
        title: series.title,
        unit: series.unit,
        branch: line.branch,
        baseline,
        direction: baseline.direction,
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
  // Regressions first, then improvements, then neutral; within a direction the
  // largest relative move first. Ranked (not "is it a regression") because the
  // list mixes three directions — a two-way test gives contradictory answers
  // for improvement-vs-neutral pairs, and an inconsistent comparator makes the
  // sort order unspecified.
  return results.sort(
    (a, b) =>
      DIRECTION_RANK[b.direction] - DIRECTION_RANK[a.direction] ||
      Math.abs(b.baseline.deltaFraction) - Math.abs(a.baseline.deltaFraction),
  )
}
