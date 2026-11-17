import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease, scheduledRelease} from '../__fixtures__/release.fixture'
import {
  getReleaseDateFilterBounds,
  isSameReleaseDateFilter,
  releaseMatchesDateFilter,
  releaseTimingOverlapsRange,
  releaseTimingSpanOverlapsRange,
  resolveReleaseDateFilter,
} from './releaseDateFilter'

// Week of Mon 16 Nov 2026, as instants (UTC for the test).
const week = {from: new Date('2026-11-16T00:00:00Z'), to: new Date('2026-11-23T00:00:00Z')}

describe('releaseTimingSpanOverlapsRange', () => {
  it('matches a point inside the range, including its first instant', () => {
    const at = (iso: string) => ({start: new Date(iso), end: new Date(iso)})
    expect(releaseTimingSpanOverlapsRange(at('2026-11-16T00:00:00Z'), week)).toBe(true)
    expect(releaseTimingSpanOverlapsRange(at('2026-11-20T09:00:00Z'), week)).toBe(true)
  })

  it('treats the range end as exclusive', () => {
    const at = new Date('2026-11-23T00:00:00Z')
    expect(releaseTimingSpanOverlapsRange({start: at, end: at}, week)).toBe(false)
  })

  it('matches a window that overlaps the range on either edge, and one that spans it', () => {
    // The shape a release window will take: start + end. Overlap, not containment.
    const startsBefore = {
      start: new Date('2026-11-10T00:00:00Z'),
      end: new Date('2026-11-17T00:00:00Z'),
    }
    const endsAfter = {
      start: new Date('2026-11-22T00:00:00Z'),
      end: new Date('2026-12-01T00:00:00Z'),
    }
    const spans = {start: new Date('2026-11-01T00:00:00Z'), end: new Date('2026-12-31T00:00:00Z')}
    const before = {start: new Date('2026-11-01T00:00:00Z'), end: new Date('2026-11-15T23:59:59Z')}
    expect(releaseTimingSpanOverlapsRange(startsBefore, week)).toBe(true)
    expect(releaseTimingSpanOverlapsRange(endsAfter, week)).toBe(true)
    expect(releaseTimingSpanOverlapsRange(spans, week)).toBe(true)
    expect(releaseTimingSpanOverlapsRange(before, week)).toBe(false)
  })
})

describe('releaseTimingOverlapsRange', () => {
  it('never matches an undated release', () => {
    expect(releaseTimingOverlapsRange({date: null}, week)).toBe(false)
  })
})

describe('getReleaseDateFilterBounds', () => {
  const start = new Date(2026, 10, 16, 15, 30)

  it('makes a day a one-day range from midnight', () => {
    expect(getReleaseDateFilterBounds(start, 'day')).toEqual({
      from: new Date(2026, 10, 16),
      to: new Date(2026, 10, 17),
    })
  })

  it('makes a week seven days and a month one calendar month', () => {
    expect(getReleaseDateFilterBounds(start, 'week').to).toEqual(new Date(2026, 10, 23))
    expect(getReleaseDateFilterBounds(new Date(2026, 10, 1), 'month').to).toEqual(
      new Date(2026, 11, 1),
    )
  })
})

describe('resolveReleaseDateFilter', () => {
  it('converts the wall-clock bounds with the time zone converter', () => {
    // A zone two hours ahead of the wall clock: wall-clock midnight is 22:00 the day before.
    const zoneDateToUtc = (date: Date) => new Date(date.getTime() - 2 * 3_600_000)
    const resolved = resolveReleaseDateFilter(
      {kind: 'range', unit: 'day', start: new Date(2026, 10, 16)},
      zoneDateToUtc,
    )
    expect(resolved).toEqual({
      kind: 'range',
      range: {
        from: new Date(new Date(2026, 10, 16).getTime() - 2 * 3_600_000),
        to: new Date(new Date(2026, 10, 17).getTime() - 2 * 3_600_000),
      },
    })
  })

  it('passes the unscheduled filter through', () => {
    expect(resolveReleaseDateFilter({kind: 'unscheduled'}, (date) => date)).toEqual({
      kind: 'unscheduled',
    })
  })
})

describe('releaseMatchesDateFilter', () => {
  const armed: ReleaseDocument = {...scheduledRelease, publishAt: '2026-11-18T10:00:00Z'}
  // Intended, not armed: dated by intent only. It is on the timeline, so it matches a range too.
  const intended: ReleaseDocument = {
    ...activeASAPRelease,
    metadata: {...activeASAPRelease.metadata, intendedPublishAt: '2026-11-19T10:00:00Z'},
  }
  const undated: ReleaseDocument = {
    ...activeASAPRelease,
    metadata: {...activeASAPRelease.metadata, intendedPublishAt: undefined},
  }

  it('matches armed and intended dates in the range, never undated releases', () => {
    const filter = {kind: 'range', range: week} as const
    expect(releaseMatchesDateFilter(armed, filter)).toBe(true)
    expect(releaseMatchesDateFilter(intended, filter)).toBe(true)
    expect(releaseMatchesDateFilter(undated, filter)).toBe(false)
  })

  it('matches only undated releases for the unscheduled filter', () => {
    const filter = {kind: 'unscheduled'} as const
    expect(releaseMatchesDateFilter(armed, filter)).toBe(false)
    expect(releaseMatchesDateFilter(intended, filter)).toBe(false)
    expect(releaseMatchesDateFilter(undated, filter)).toBe(true)
  })
})

describe('isSameReleaseDateFilter', () => {
  const day = new Date(2026, 10, 16)

  it('compares unit and start day', () => {
    expect(
      isSameReleaseDateFilter(
        {kind: 'range', unit: 'week', start: day},
        {kind: 'range', unit: 'week', start: new Date(2026, 10, 16, 12)},
      ),
    ).toBe(true)
    expect(
      isSameReleaseDateFilter(
        {kind: 'range', unit: 'week', start: day},
        {kind: 'range', unit: 'day', start: day},
      ),
    ).toBe(false)
  })

  it('handles unscheduled and missing filters', () => {
    expect(isSameReleaseDateFilter({kind: 'unscheduled'}, {kind: 'unscheduled'})).toBe(true)
    expect(isSameReleaseDateFilter({kind: 'unscheduled'}, undefined)).toBe(false)
    expect(isSameReleaseDateFilter(undefined, undefined)).toBe(true)
  })
})
