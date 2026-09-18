import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeScheduledRelease} from '../__fixtures__/release.fixture'
import {
  getReleaseTimeBucket,
  groupReleasesByTimeBucket,
  type ReleaseTimeBucket,
} from './getReleaseTimeBuckets'

const NOW = new Date('2026-06-15T12:00:00Z')

function scheduledAt(id: string, intendedPublishAt: string): ReleaseDocument {
  return {
    ...activeScheduledRelease,
    _id: `_.releases.${id}`,
    metadata: {...activeScheduledRelease.metadata, releaseType: 'scheduled', intendedPublishAt},
  }
}

function withType(id: string, releaseType: 'asap' | 'undecided'): ReleaseDocument {
  const {intendedPublishAt: _omitted, ...metadata} = activeScheduledRelease.metadata

  return {
    ...activeScheduledRelease,
    _id: `_.releases.${id}`,
    metadata: {...metadata, releaseType},
  }
}

describe('getReleaseTimeBucket', () => {
  it.each<[string, ReleaseDocument, ReleaseTimeBucket]>([
    ['a date that has passed', scheduledAt('past', '2026-06-01T12:00:00Z'), 'overdue'],
    ['three days out', scheduledAt('soon', '2026-06-18T12:00:00Z'), 'thisWeek'],
    ['ten days out', scheduledAt('tenDays', '2026-06-25T12:00:00Z'), 'thisMonth'],
    ['two months out', scheduledAt('twoMonths', '2026-08-15T12:00:00Z'), 'thisQuarter'],
    ['six months out', scheduledAt('sixMonths', '2026-12-15T12:00:00Z'), 'later'],
    ['no date at all', withType('noDate', 'undecided'), 'undecided'],
  ])('places %s in %s', (_label, release, expected) => {
    expect(getReleaseTimeBucket(release, NOW)).toBe(expected)
  })

  it('places an asap release by type, not by any date it happens to carry', () => {
    // asap publishes at the next opportunity, so its position is in the sequence rather than in
    // time. A stale `intendedPublishAt` must not drag it into `overdue`.
    const asapWithStaleDate: ReleaseDocument = {
      ...scheduledAt('asap', '2026-06-01T12:00:00Z'),
      metadata: {
        ...activeScheduledRelease.metadata,
        releaseType: 'asap',
        intendedPublishAt: '2026-06-01T12:00:00Z',
      },
    }

    expect(getReleaseTimeBucket(asapWithStaleDate, NOW)).toBe('asap')
  })

  it('treats each window as inclusive of its own edge and exclusive of the one before', () => {
    // Exactly seven days out is the last moment of `thisWeek`; a second later belongs to the next
    // band. Without this the bands overlap and a release can read as two things.
    expect(getReleaseTimeBucket(scheduledAt('edge', '2026-06-22T12:00:00Z'), NOW)).toBe('thisWeek')
    expect(getReleaseTimeBucket(scheduledAt('over', '2026-06-22T12:00:01Z'), NOW)).toBe('thisMonth')
  })
})

describe('groupReleasesByTimeBucket', () => {
  it('orders each band by date, soonest first', () => {
    const grouped = groupReleasesByTimeBucket(
      [
        scheduledAt('third', '2026-06-20T12:00:00Z'),
        scheduledAt('first', '2026-06-16T12:00:00Z'),
        scheduledAt('second', '2026-06-18T12:00:00Z'),
      ],
      NOW,
    )

    expect(grouped.thisWeek.map(({_id}) => _id)).toEqual([
      '_.releases.first',
      '_.releases.second',
      '_.releases.third',
    ])
  })

  it('keeps every band, so an empty one renders nothing rather than being absent', () => {
    const grouped = groupReleasesByTimeBucket([scheduledAt('one', '2026-06-16T12:00:00Z')], NOW)

    expect(grouped.thisWeek).toHaveLength(1)
    expect(grouped.overdue).toEqual([])
    expect(grouped.undecided).toEqual([])
  })

  it('sorts dateless releases behind dated ones within a band', () => {
    const grouped = groupReleasesByTimeBucket(
      [withType('noDateA', 'asap'), withType('noDateB', 'asap')],
      NOW,
    )

    expect(grouped.asap).toHaveLength(2)
  })
})
