import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../__fixtures__/release.fixture'
import {getReleaseAttention, RELEASE_ATTENTION_WINDOW_DAYS} from '../getReleaseAttention'

const NOW = new Date('2026-11-17T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function at(offsetMs: number): string {
  return new Date(NOW.getTime() + offsetMs).toISOString()
}

function withIntendedDate(release: ReleaseDocument, intendedPublishAt: string): ReleaseDocument {
  return {...release, metadata: {...release.metadata, intendedPublishAt}}
}

describe('getReleaseAttention', () => {
  it('flags an open release whose intended date has passed', () => {
    const release = withIntendedDate(activeScheduledRelease, at(-DAY_MS))

    expect(getReleaseAttention(release, NOW)).toBe('overdue')
  })

  it('flags an open release whose intended date is inside the window', () => {
    const release = withIntendedDate(activeScheduledRelease, at(2 * DAY_MS))

    expect(getReleaseAttention(release, NOW)).toBe('due-soon')
  })

  it('includes the last moment of the window', () => {
    const release = withIntendedDate(
      activeScheduledRelease,
      at(RELEASE_ATTENTION_WINDOW_DAYS * DAY_MS),
    )

    expect(getReleaseAttention(release, NOW)).toBe('due-soon')
  })

  it('ignores an intended date beyond the window', () => {
    const release = withIntendedDate(
      activeScheduledRelease,
      at(RELEASE_ATTENTION_WINDOW_DAYS * DAY_MS + 1),
    )

    expect(getReleaseAttention(release, NOW)).toBeNull()
  })

  it('ignores a scheduled release, even when its date is close', () => {
    const release: ReleaseDocument = {...scheduledRelease, publishAt: at(DAY_MS)}

    expect(getReleaseAttention(release, NOW)).toBeNull()
  })

  it('ignores a release with no date', () => {
    expect(getReleaseAttention(activeASAPRelease, NOW)).toBeNull()
  })

  it('reads the dates, not the release type', () => {
    // An ASAP-typed release that still carries an intended date is judged by that date.
    const release = withIntendedDate(activeASAPRelease, at(-DAY_MS))

    expect(getReleaseAttention(release, NOW)).toBe('overdue')
  })

  it.each([
    ['archived', archivedScheduledRelease],
    ['published', publishedASAPRelease],
  ])('never counts a %s release', (_state, fixture) => {
    const release = withIntendedDate(fixture, at(-DAY_MS))

    expect(getReleaseAttention(release, NOW)).toBeNull()
  })
})
