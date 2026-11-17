/**
 * Weekly buckets for the style-migration histograms — the reading Linear's
 * "StyleX adoption per week" chart gives a migration: one bar per calendar
 * week, so a months-long effort reads as a staircase of progress rather than
 * as a noisy daily line.
 *
 * A week's bar is the **median of that week's points** (one point per commit,
 * as `buildSeries` already merged them). Median, not the last run, for the
 * same reason the trend line uses it: a single odd run must not own a whole
 * bar. Weeks without a run stay empty — a gap is honest, an interpolated bar
 * would claim a measurement nobody took — and so do the weeks before a build
 * shipped `@sanity/ui` v5, whose runs record no adoption row at all.
 *
 * Weeks start on Monday, in UTC, so a bar is the same week on every reader's
 * machine and the label under it is a real date.
 */
import {type TrendPoint} from './data'

const DAY_MS = 24 * 60 * 60 * 1000
export const WEEK_MS = 7 * DAY_MS

export interface WeekBucket {
  /** Monday 00:00 UTC of the week. */
  weekStart: Date
  /** Median of the week's points, or null for a week without one (an axis gap). */
  value: number | null
  /** Points (commits) the median is over; 0 for an empty week. */
  runs: number
  /** The newest point in the week — the click-through and bisect anchor. */
  latest?: TrendPoint
}

/** Monday 00:00 UTC of the week holding `date`. */
export function startOfWeek(date: Date): Date {
  const day = date.getUTCDay() // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday),
  )
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Every week from the first point's to the last point's, in order, each with
 * the median of its points — empty weeks included, so the axis stays a true
 * time axis (a chart that skipped empty weeks would make a two-month CI
 * outage look like one busy fortnight).
 */
export function weeklyBuckets(points: TrendPoint[]): WeekBucket[] {
  if (points.length === 0) return []
  const byWeek = new Map<number, TrendPoint[]>()
  for (const point of points) {
    const key = startOfWeek(point.date).getTime()
    const bucket = byWeek.get(key)
    if (bucket) bucket.push(point)
    else byWeek.set(key, [point])
  }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b)
  const buckets: WeekBucket[] = []
  for (let week = weeks[0]; week <= weeks[weeks.length - 1]; week += WEEK_MS) {
    const inWeek = byWeek.get(week)
    if (!inWeek) {
      buckets.push({weekStart: new Date(week), value: null, runs: 0})
      continue
    }
    const latest = inWeek.reduce((newest, point) =>
      point.date.getTime() > newest.date.getTime() ? point : newest,
    )
    buckets.push({
      weekStart: new Date(week),
      value: medianOf(inWeek.map((point) => point.value)),
      runs: inWeek.length,
      latest,
    })
  }
  return buckets
}

/**
 * The move between the newest two non-empty weeks, in the metric's unit:
 * the "this week vs last" statement a migration chart leads with. Null with
 * fewer than two measured weeks.
 */
export function weekOverWeek(buckets: WeekBucket[]): {latest: WeekBucket; delta: number} | null {
  const measured = buckets.filter((bucket) => bucket.value !== null)
  if (measured.length < 2) return null
  const latest = measured[measured.length - 1]
  const previous = measured[measured.length - 2]
  return {latest, delta: latest.value! - previous.value!}
}

/** `Mar 8, 2026` — the week's Monday, as Linear's data table labels its rows. */
export function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** `2026-03` — the axis tick for a week that opens a new month, as Linear's axis reads. */
export function monthTick(weekStart: Date): string {
  return `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Which buckets get an axis tick: the first week of every month, so a
 * six-month chart reads `2026-03 … 2026-08` rather than 26 dates — plus the
 * very first bucket when it does not open a month, so a short history still
 * has an origin label.
 */
export function monthTickIndices(buckets: WeekBucket[]): number[] {
  const indices: number[] = []
  for (const [index, bucket] of buckets.entries()) {
    const previous = buckets[index - 1]
    const opensMonth =
      !previous || previous.weekStart.getUTCMonth() !== bucket.weekStart.getUTCMonth()
    if (opensMonth) indices.push(index)
  }
  return indices
}
