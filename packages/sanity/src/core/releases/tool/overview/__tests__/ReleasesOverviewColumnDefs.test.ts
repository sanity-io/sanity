import {describe, expect, it} from 'vitest'

import {TABLE_ROW_ACTIONS_WIDTH} from '../../components/Table/Table'
import {
  getReleasesOverviewMinContentWidth,
  RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH,
  releasesOverviewColumnDefs,
} from '../ReleasesOverviewColumnDefs'

const t = ((key: string) => key) as Parameters<typeof releasesOverviewColumnDefs>[0]

describe('releasesOverviewColumnDefs', () => {
  it('lets the title column shrink instead of locking it to half the viewport', () => {
    const titleColumn = releasesOverviewColumnDefs(t, 'active').find(
      (column) => column.id === 'metadata.title',
    )

    expect(titleColumn?.style?.minWidth).toBe(RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH)
    expect(titleColumn?.style?.maxWidth).toBeUndefined()
    expect(String(titleColumn?.style?.minWidth)).not.toContain('100vw')
    expect(String(titleColumn?.style?.minWidth)).not.toContain('%')
  })

  it('keeps the active-table minimum width inside a 1280px window with the calendar open', () => {
    const minContentWidth = getReleasesOverviewMinContentWidth(
      releasesOverviewColumnDefs(t, 'active'),
    )

    expect(minContentWidth).toBe(
      RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH + 280 + 150 + 40 + 120 + TABLE_ROW_ACTIONS_WIDTH,
    )
    expect(minContentWidth).toBeLessThan(1000)
  })

  it('keeps the archived-table minimum width inside the same window', () => {
    const minContentWidth = getReleasesOverviewMinContentWidth(
      releasesOverviewColumnDefs(t, 'archived'),
    )

    expect(minContentWidth).toBeLessThan(1000)
  })
})
