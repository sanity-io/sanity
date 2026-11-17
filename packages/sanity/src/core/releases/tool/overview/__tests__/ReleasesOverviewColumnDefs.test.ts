import {describe, expect, it} from 'vitest'

import {TABLE_ROW_ACTIONS_WIDTH, type Column} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'
import {
  RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH,
  releasesOverviewColumnDefs,
} from '../ReleasesOverviewColumnDefs'

const t = ((key: string) => key) as Parameters<typeof releasesOverviewColumnDefs>[0]

function getMinContentWidth(columns: Column<TableRelease>[]): number {
  const columnWidth = columns
    .filter((column) => !column.hidden)
    .reduce((sum, column) => {
      if (typeof column.width === 'number') return sum + column.width
      const minWidth = column.style?.minWidth
      return sum + (typeof minWidth === 'number' ? minWidth : 0)
    }, 0)

  return columnWidth + TABLE_ROW_ACTIONS_WIDTH
}

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
    const minContentWidth = getMinContentWidth(releasesOverviewColumnDefs(t, 'active'))

    expect(minContentWidth).toBe(
      RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH + 280 + 150 + 40 + 120 + TABLE_ROW_ACTIONS_WIDTH,
    )
    expect(minContentWidth).toBeLessThan(1000)
  })

  it('keeps the archived-table minimum width inside the same window', () => {
    expect(getMinContentWidth(releasesOverviewColumnDefs(t, 'archived'))).toBeLessThan(1000)
  })
})
