import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {ReleasesMenuItem} from '../releases/ReleasesMenuItem'

describe('ReleasesMenuItem', () => {
  it('centres the lock icon on a scheduled release row with a title and a date line', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: 320}}>
          <Menu>
            <ReleasesMenuItem rangePosition={undefined} release={scheduledRelease} />
          </Menu>
        </div>
      </TestWrapper>,
    )

    const lock = page.getByTestId('release-lock-icon')
    await expect.element(lock).toBeVisible()
    const row = lock.element().closest('[data-ui="MenuItem"]')
    if (!row) throw new Error('menu item not found')

    const centres = () => {
      const lockBox = lock.element().getBoundingClientRect()
      const rowBox = row.getBoundingClientRect()
      return {
        lock: lockBox.top + lockBox.height / 2,
        row: rowBox.top + rowBox.height / 2,
        rowHeight: rowBox.height,
      }
    }
    await expectStable(() => JSON.stringify(centres()))

    const {lock: lockCentre, row: rowCentre, rowHeight} = centres()
    // Two text lines (title and publish date), so the row is taller than a single-line row.
    expect(rowHeight).toBeGreaterThan(40)
    expect(Math.abs(lockCentre - rowCentre)).toBeLessThanOrEqual(1)
  })
})
