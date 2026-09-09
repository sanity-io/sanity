/**
 * Drift detection: "did any metric move enough to care?"
 *
 * One baseline: the median of the last 7 runs against the median of the 21
 * before them (one point per commit — `buildSeries` merges re-runs). A move
 * counts when it passes all three of:
 *
 * 1. an absolute floor per unit — for ms the gate's interaction floor of 16ms
 *    (perf/bench/stats/gate.ts; two Event Timing quantisation steps);
 * 2. a relative floor of 5% of the baseline — the gate's interaction figure,
 *    applied to every ms series (the gate's looser pageload pair, 100ms and
 *    8%, is not used: drift cannot tell load from keystroke metrics by unit,
 *    and a load metric that clears 8% clears 5%); and
 * 3. a noise test: at least NOISE_Z standard errors of the window comparison,
 *    with the noise estimated from the series itself (`noiseSigma`).
 *
 * The third test is what makes the feed reviewable: run-to-run noise on these
 * metrics (11–22% on keystroke latency) is well over the 5% floor, so the
 * floors alone flagged ~68% of all windows on the stored history — about what
 * pure noise would. Windows are run-counted, not day-counted; the statistic is
 * the median (matching the plotted point and the gate); host speed is not
 * corrected for. The derivation, the measurements behind each of those
 * choices and the alternatives that were rejected are in SPEC.md, "Drift
 * feed" — this header only repeats the numbers the constants below depend on.
 */
import {formatValue, type TrendPoint, type TrendSeries, type TrendUnit} from './data'

interface DriftThreshold {
  absolute: number
  relative: number
}

/**
 * Floors by unit. For ms this is the gate's INTERACTION_THRESHOLDS (16ms, 5%),
 * applied to load metrics too — the gate's PAGELOAD_THRESHOLDS (100ms, 8%) are
 * deliberately not mirrored, since drift cannot tell the two kinds apart by
 * unit and the tighter pair is a superset. The other units are drift's own.
 */
function thresholdFor(unit: TrendUnit): DriftThreshold {
  // 16ms = two Event Timing quantisation steps (8ms granularity), the gate's
  // interaction floor. Load metrics are far above it, so one floor serves both.
  if (unit === 'ms') return {absolute: 16, relative: 0.05}
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

/**
 * How many standard errors the window difference must clear. 2.5 is a nominal
 * ~1% two-sided false-alarm rate per series; with ~50 series on the board that
 * is about one spurious flag standing at any time. z = 2 left two to three
 * (and 24% of keystroke windows firing on the stored history); z = 3 starts
 * hiding real 10% shifts on the noisier series.
 */
export const NOISE_Z = 2.5

/**
 * Standard error of a sample median relative to a sample mean under Gaussian
 * noise (√(π/2)). The noise test uses medians, so their wider spread has to
 * be priced in or the test is too eager.
 */
const MEDIAN_EFFICIENCY = Math.sqrt(Math.PI / 2)

/** 1.4826 × MAD estimates σ for Gaussian noise; robust to a few outliers. */
const MAD_TO_SIGMA = 1.4826

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function medianAbsoluteDeviation(values: number[], center: number): number {
  return median(values.map((value) => Math.abs(value - center))) ?? 0
}

/**
 * Per-run noise (σ) of a series, in its own unit, from the points the window
 * comparison uses. Three robust estimates, take the largest:
 *
 * - MAD of consecutive differences across both windows (÷√2, since a
 *   difference of two iid samples has √2 the spread of one). Catches
 *   run-to-run scatter; a single step change inside the window is one outlier
 *   and does not inflate it.
 * - The same over the recent window alone. Seven of 27 steps cannot move the
 *   whole-window MAD, so scatter that only starts in the recent window — a
 *   host change that makes a stable series jittery — is invisible to it, and
 *   a flat prior would otherwise make any recent wobble look infinitely
 *   significant.
 * - MAD of the prior window's residuals around its own median. Catches slow
 *   wander — host image changes, gradual regressions — that consecutive
 *   differences understate because each step is small. Deliberately NOT
 *   computed for the recent window: a ramp inside the last 7 runs is a level
 *   change in progress, not noise.
 *
 * Under iid Gaussian noise the estimates agree; taking the max means whichever
 * kind of noise a series has, the threshold rises to meet it. Zero for a
 * perfectly repeatable series (counts that never move), so any move past the
 * floors flags — correct: a count that has never varied and now did is a real
 * change.
 */
function noiseSigma(
  windowValues: number[],
  recentValues: number[],
  priorValues: number[],
  priorMedian: number,
): number {
  const stepsOf = (values: number[]) => values.slice(1).map((value, index) => value - values[index])
  const sigmaFromSteps = (values: number[]) =>
    (MAD_TO_SIGMA * medianAbsoluteDeviation(stepsOf(values), 0)) / Math.SQRT2
  const fromResiduals = MAD_TO_SIGMA * medianAbsoluteDeviation(priorValues, priorMedian)
  return Math.max(sigmaFromSteps(windowValues), sigmaFromSteps(recentValues), fromResiduals)
}

export type DriftDirection = 'regression' | 'improvement' | 'neutral'

export interface DriftBaseline {
  recent: number
  baseline: number
  delta: number
  /**
   * `delta` as a fraction of the baseline. ±Infinity when the baseline is 0
   * and the series moved (a move from nothing has no finite relative size, and
   * it should sort first, not last) — display through `deltaLabel`, which
   * falls back to the absolute move in that case.
   */
  deltaFraction: number
  direction: DriftDirection
  /**
   * Per-run noise of the series in its unit (see `noiseSigma`), and the
   * standard error of `delta` it implies. `zScore` is |delta| / standardError
   * — how many times its own noise the series moved; the noise test is
   * `zScore >= NOISE_Z`. Infinity when the series has no noise at all.
   */
  noiseSigma: number
  standardError: number
  zScore: number
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
  return `median of the last ${baseline.recentPointsMs.length} runs vs the prior ${baseline.baselinePointsMs.length} runs`
}

/**
 * The move for badges and feed rows: a signed percentage of the baseline, or
 * the signed absolute move when the baseline was 0 and a percentage has no
 * meaning ("+4" for a tripwire count that went 0 → 4).
 */
export function deltaLabel(baseline: DriftBaseline, unit: TrendUnit): string {
  const sign = baseline.delta > 0 ? '+' : baseline.delta < 0 ? '−' : ''
  if (!Number.isFinite(baseline.deltaFraction)) {
    return `${sign}${formatValue(Math.abs(baseline.delta), unit)}`
  }
  return `${sign}${Math.abs(baseline.deltaFraction * 100).toFixed(0)}%`
}

/**
 * The move as a multiple of the series' own noise — the third test, stated so
 * a reader can see why a 6% move flagged on one chart and a 9% move did not on
 * another. "∞× noise" for a series that has never varied.
 */
export function noiseLabel(baseline: DriftBaseline): string {
  if (!Number.isFinite(baseline.zScore)) return '∞× noise'
  return `${baseline.zScore.toFixed(1)}× noise`
}

export interface DriftResult {
  seriesKey: string
  title: string
  unit: TrendUnit
  branch: string
  /**
   * The window comparison for this line. Not necessarily a flagged move:
   * neutral entries exist so charts can draw the overlay everywhere — check
   * `direction` before treating it as a finding.
   */
  baseline: DriftBaseline
  direction: DriftDirection
  /** The most recent run in this line — for backlinks to the likely culprit. */
  latest: Pick<TrendPoint, 'runId' | 'sha' | 'prNumber' | 'ciRunId' | 'ciRunAttempt'>
}

function classify(
  recent: number,
  baseline: number,
  standardError: number,
  threshold: DriftThreshold,
  goal: TrendSeries['goal'],
): DriftDirection {
  const delta = recent - baseline
  // The gate's rule (gate.ts): the minimum effect is the larger of the absolute
  // floor and the relative floor of the baseline. Written that way rather than
  // as two checks so a baseline of 0 is handled: a tripwire count ("sessions
  // not settled") sitting at 0 has no relative scale, and a move to 4 must
  // flag on the absolute floor alone — an earlier `baseline !== 0` guard made
  // such series unflaggable.
  const minimumEffect = Math.max(threshold.absolute, threshold.relative * Math.abs(baseline))
  const cleared =
    Math.abs(delta) >= minimumEffect &&
    // standardError is 0 for a series that never varies: any move that
    // cleared the floors is then real by definition
    Math.abs(delta) >= NOISE_Z * standardError
  if (!cleared || goal === 'context') return 'neutral'
  // Lower is better: a rise is a regression
  return delta > 0 ? 'regression' : 'improvement'
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
  const windowPoints = points.slice(-(RECENT_RUNS + BASELINE_RUNS))
  const values = windowPoints.map((point) => point.value)
  const recentPoints = windowPoints.slice(-RECENT_RUNS)
  const priorPoints = windowPoints.slice(0, -RECENT_RUNS)
  const recentValues = values.slice(-RECENT_RUNS)
  const priorValues = values.slice(0, -RECENT_RUNS)
  const recent = median(recentValues)
  const prior = median(priorValues)
  if (recent === null || prior === null) return null

  const sigma = noiseSigma(values, recentValues, priorValues, prior)
  const standardError =
    sigma * MEDIAN_EFFICIENCY * Math.sqrt(1 / recentValues.length + 1 / priorValues.length)
  const delta = recent - prior
  // A sub-threshold move is still a real comparison worth drawing — the charts
  // show the overlay on every series, and `direction: 'neutral'` is what keeps
  // it out of the review feed and the tab counts.
  const direction = classify(recent, prior, standardError, threshold, goal)
  return {
    recent,
    baseline: prior,
    delta,
    deltaFraction:
      prior === 0 ? (delta === 0 ? 0 : Math.sign(delta) * Infinity) : delta / Math.abs(prior),
    direction,
    noiseSigma: sigma,
    standardError,
    zScore: standardError === 0 ? (delta === 0 ? 0 : Infinity) : Math.abs(delta) / standardError,
    recentPointsMs: recentPoints.map((point) => point.date.getTime()),
    baselinePointsMs: priorPoints.map((point) => point.date.getTime()),
  }
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
