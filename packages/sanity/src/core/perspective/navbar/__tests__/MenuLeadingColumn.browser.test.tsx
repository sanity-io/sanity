import {CalendarIcon} from '@sanity/icons/Calendar'
import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {activeASAPRelease, scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {LATEST, PUBLISHED} from '../../../releases/util/const'
import {ReleasesMenuItem} from '../releases/ReleasesMenuItem'

describe('navbar menu leading column', () => {
  it('centres every row glyph in one column, on the first text line, and starts every title at the same place', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: 320}}>
          <Menu>
            <ReleasesMenuItem rangePosition={undefined} release={PUBLISHED} />
            <ReleasesMenuItem rangePosition={undefined} release={LATEST} />
            <ReleasesMenuItem rangePosition={undefined} release={activeASAPRelease} />
            <ReleasesMenuItem rangePosition={undefined} release={scheduledRelease} />
            <MenuItem icon={CalendarIcon} text="View content releases" data-testid="footer-item" />
          </Menu>
        </div>
      </TestWrapper>,
    )

    await expect.element(page.getByText(scheduledRelease.metadata.title)).toBeVisible()
    const items = [...document.querySelectorAll<HTMLElement>('[data-ui="MenuItem"]')]
    expect(items).toHaveLength(5)

    const geometry = () =>
      items.map((item) => {
        const glyph = item.querySelector('svg')
        // The title is the first text line of every row
        const title = item.querySelector('[data-ui="Text"]')
        if (!glyph || !title) throw new Error('row glyph or title not found')
        const itemBox = item.getBoundingClientRect()
        const glyphBox = glyph.getBoundingClientRect()
        const titleBox = title.getBoundingClientRect()
        return {
          glyphCentreX: glyphBox.left + glyphBox.width / 2 - itemBox.left,
          glyphCentreY: glyphBox.top + glyphBox.height / 2 - itemBox.top,
          titleCentreY: titleBox.top + titleBox.height / 2 - itemBox.top,
          titleLeft: titleBox.left - itemBox.left,
        }
      })
    await expectStable(() => JSON.stringify(geometry()))

    const rows = geometry()
    const [first] = rows
    for (const row of rows) {
      expect(Math.abs(row.glyphCentreX - first.glyphCentreX)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(row.titleLeft - first.titleLeft)).toBeLessThanOrEqual(0.5)
      // On the first line, so the two-line scheduled row reads like the others
      expect(Math.abs(row.glyphCentreY - row.titleCentreY)).toBeLessThanOrEqual(1)
    }
  })
})
