import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {LATEST, PUBLISHED} from '../../../releases/util/const'
import {ReleasesMenuItem} from '../releases/ReleasesMenuItem'

describe('ReleasesMenuItem layer line', () => {
  it('centres each row icon on the layer line and starts every title at the same place', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: 320}}>
          <Menu>
            <ReleasesMenuItem rangePosition="first" release={PUBLISHED} />
            <ReleasesMenuItem rangePosition="within" release={LATEST} />
            <ReleasesMenuItem rangePosition="last" release={activeASAPRelease} />
          </Menu>
        </div>
      </TestWrapper>,
    )

    await expect.element(page.getByText(activeASAPRelease.metadata.title)).toBeVisible()
    const rows = [...document.querySelectorAll<HTMLElement>('[data-stack-line]')]
    expect(rows).toHaveLength(3)

    const geometry = () =>
      rows.map((row) => {
        const icon = row.querySelector('[data-testid="release-indicator-icon"] svg')
        const item = row.querySelector('[data-ui="MenuItem"]')
        if (!icon || !item) throw new Error('row icon or menu item not found')
        const rowStyle = getComputedStyle(row)
        const lineLeft = parseFloat(rowStyle.getPropertyValue('--indicator-left'))
        const lineWidth = parseFloat(rowStyle.getPropertyValue('--indicator-width'))
        const lineSplit = parseFloat(rowStyle.getPropertyValue('--indicator-in-range-height'))
        const iconBox = icon.getBoundingClientRect()
        const rowBox = row.getBoundingClientRect()
        const itemBox = item.getBoundingClientRect()
        const iconCentreX = iconBox.left + iconBox.width / 2
        return {
          iconSize: iconBox.width,
          offLineX: iconCentreX - (rowBox.left + lineLeft + lineWidth / 2),
          offLineY: iconBox.top + iconBox.height / 2 - (itemBox.top + lineSplit),
        }
      })
    await expectStable(() => JSON.stringify(geometry()))

    for (const {iconSize, offLineX, offLineY} of geometry()) {
      // The 21px box every other menu icon uses
      expect(iconSize).toBe(21)
      expect(Math.abs(offLineX)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(offLineY)).toBeLessThanOrEqual(0.5)
    }
  })
})
