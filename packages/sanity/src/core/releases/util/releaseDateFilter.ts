import {type ReleaseDocument} from '@sanity/client'
import {addDays} from 'date-fns/addDays'
import {addMonths} from 'date-fns/addMonths'
import {addWeeks} from 'date-fns/addWeeks'
import {isSameDay} from 'date-fns/isSameDay'
import {startOfDay} from 'date-fns/startOfDay'

import {getReleaseTiming, type ReleaseTiming} from './getReleaseTiming'

/**
 * The size of a date filter bucket. A day picked in the calendar is a one-day range; a timeline
 * column heading is a week or a month range.
 *
 * @internal
 */
export type ReleaseDateFilterUnit = 'day' | 'week' | 'month'

/**
 * What the releases overview is filtered to, as the user picked it.
 *
 * - `range`: releases whose timing falls in the bucket of `unit` that begins on `start`. `start`
 *   holds wall-clock date components in the content-releases time zone (its getters read the
 *   picked day), not a UTC instant; {@link resolveReleaseDateFilter} turns it into instants.
 * - `unscheduled`: releases with no date at all.
 *
 * @internal
 */
export type ReleaseDateFilter =
  | {kind: 'range'; unit: ReleaseDateFilterUnit; start: Date}
  | {kind: 'unscheduled'}

/**
 * A half-open span of real instants, `[from, to)`.
 *
 * @internal
 */
export interface ReleaseDateRange {
  from: Date
  to: Date
}

/**
 * A {@link ReleaseDateFilter} with its bucket resolved to real instants, ready to test releases.
 *
 * @internal
 */
export type ResolvedReleaseDateFilter =
  | {kind: 'range'; range: ReleaseDateRange}
  | {kind: 'unscheduled'}

/**
 * The span of time a release occupies. Today a release has one date, so the span is a point
 * (`start === end`). When releases carry a window (a start and an optional end), this is the only
 * place that changes: `end` becomes the window end, and every range check below already tests
 * overlap rather than containment.
 *
 * @internal
 */
export interface ReleaseTimingSpan {
  start: Date
  end: Date
}

/** @internal */
export function getReleaseTimingSpan(
  timing: Pick<ReleaseTiming, 'date'>,
): ReleaseTimingSpan | null {
  if (!timing.date) return null
  return {start: timing.date, end: timing.date}
}

/**
 * Whether a span overlaps a half-open range. A point span matches when it lies in `[from, to)`;
 * a window matches when any part of it does.
 *
 * @internal
 */
export function releaseTimingSpanOverlapsRange(
  span: ReleaseTimingSpan,
  range: ReleaseDateRange,
): boolean {
  return span.start < range.to && span.end >= range.from
}

/**
 * Whether a release's timing overlaps a range. Undated releases never match a range.
 *
 * @internal
 */
export function releaseTimingOverlapsRange(
  timing: Pick<ReleaseTiming, 'date'>,
  range: ReleaseDateRange,
): boolean {
  const span = getReleaseTimingSpan(timing)
  return span !== null && releaseTimingSpanOverlapsRange(span, range)
}

/**
 * The wall-clock bounds of a bucket, `[from, to)`, as date components (not yet zone-adjusted).
 *
 * @internal
 */
export function getReleaseDateFilterBounds(
  start: Date,
  unit: ReleaseDateFilterUnit,
): ReleaseDateRange {
  const from = startOfDay(start)
  if (unit === 'week') return {from, to: addWeeks(from, 1)}
  if (unit === 'month') return {from, to: addMonths(from, 1)}
  return {from, to: addDays(from, 1)}
}

/**
 * Resolves a filter's bucket to real instants. `zoneDateToUtc` reads wall-clock components in the
 * content-releases time zone and returns the UTC instant (from `useTimeZone`).
 *
 * @internal
 */
export function resolveReleaseDateFilter(
  filter: ReleaseDateFilter,
  zoneDateToUtc: (date: Date) => Date,
): ResolvedReleaseDateFilter {
  if (filter.kind === 'unscheduled') return filter
  const bounds = getReleaseDateFilterBounds(filter.start, filter.unit)
  return {kind: 'range', range: {from: zoneDateToUtc(bounds.from), to: zoneDateToUtc(bounds.to)}}
}

/**
 * The one predicate the overview filters releases by: a range matches releases whose timing
 * overlaps it, `unscheduled` matches releases with no date. Reads timing through
 * {@link getReleaseTiming} only, so it never depends on how a release stores its date.
 *
 * @internal
 */
export function releaseMatchesDateFilter(
  release: ReleaseDocument,
  filter: ResolvedReleaseDateFilter,
): boolean {
  const timing = getReleaseTiming(release)
  if (filter.kind === 'unscheduled') return timing.date === null
  return releaseTimingOverlapsRange(timing, filter.range)
}

/** @internal */
export function isSameReleaseDateFilter(
  a: ReleaseDateFilter | undefined,
  b: ReleaseDateFilter | undefined,
): boolean {
  if (!a || !b) return a === b
  if (a.kind === 'unscheduled' || b.kind === 'unscheduled') return a.kind === b.kind
  return a.unit === b.unit && isSameDay(a.start, b.start)
}
