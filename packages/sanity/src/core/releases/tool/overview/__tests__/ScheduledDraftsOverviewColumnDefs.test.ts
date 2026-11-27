import {describe, expect, it} from 'vitest'

import {activeCardinalityOneRelease} from '../../../__fixtures__/release.fixture'
import {type Mode} from '../queryParamUtils'
import {type TableRelease} from '../ReleasesOverview'
import {scheduledDraftsOverviewColumnDefs} from '../ScheduledDraftsOverviewColumnDefs'

const t = ((key: string) => key) as Parameters<typeof scheduledDraftsOverviewColumnDefs>[0]

function getPublishAtColumn(mode: Mode) {
  return scheduledDraftsOverviewColumnDefs(t, mode).find((column) => column.id === 'publishAt')
}

const publishedLate: TableRelease = {
  ...activeCardinalityOneRelease,
  state: 'published',
  publishAt: '2026-04-24T08:34:00Z',
  publishedAt: '2026-05-11T16:48:08Z',
}

const {publishAt: _publishAt, ...withoutPublishAt} = activeCardinalityOneRelease
const archivedBeforeRunning: TableRelease = {...withoutPublishAt, state: 'archived'}
const withoutAnyDate: TableRelease = {
  ...archivedBeforeRunning,
  metadata: {...archivedBeforeRunning.metadata, intendedPublishAt: undefined},
}

describe('scheduled drafts publish date column', () => {
  it('sorts archived scheduled drafts by when they were published', () => {
    expect(getPublishAtColumn('archived')?.sortTransform?.(publishedLate, 'desc')).toBe(
      Date.parse('2026-05-11T16:48:08Z'),
    )
  })

  it('sorts an archived scheduled draft that never ran by its intended publish date', () => {
    expect(getPublishAtColumn('archived')?.sortTransform?.(archivedBeforeRunning, 'desc')).toBe(
      Date.parse(activeCardinalityOneRelease.metadata.intendedPublishAt!),
    )
  })

  it('puts archived scheduled drafts without any date last in either direction', () => {
    const sortTransform = getPublishAtColumn('archived')?.sortTransform
    expect(sortTransform?.(withoutAnyDate, 'desc')).toBe(-Infinity)
    expect(sortTransform?.(withoutAnyDate, 'asc')).toBe(Infinity)
  })

  it.each<Mode>(['active', 'paused'])('keeps sorting %s scheduled drafts by publishAt', (mode) => {
    expect(getPublishAtColumn(mode)?.sortTransform).toBeUndefined()
  })
})
